// SPDX-License-Identifier: MIT
/*
 * (C) Copyright 2020
 * Diversifying Talent in Quantum Computing, Geering Up, UBC
 */

import makeLongRequest from '../LongRequest'

import TSPutils from './TSPutils.js'
import TSPstate from './TSPstate.js'

import Graph from './Graph.js'

/**
 * This function does the XML HTTP request for the TSP Widget. It calls the
 * backend, and once the data is returned, postSolve is called. This handles
 * request creation.
 */
function tspSolveRequest (graphParams, setters, consoleFns) {
  const selectedEdges = graphParams.selectedEdges
  const key = graphParams.key

  const tspState = TSPstate.getInstance()

  // Set the parameters to send to the server
  const params = {
    typeOfProblem: 'tspSolving',
    selectedEdges: selectedEdges
  }

  // Make the request for a solve to be queued up
  // makeLongRequest is a powerful function, please
  // use it wisely
  makeLongRequest(
    params,
    (xhr) => {
      consoleFns.outputToConsole('The graph has been queued for solving!')
      tspState.setSolvingState(xhr.response.jobStatus)
    },
    (xhr) => {
      if (xhr.response.jobStatus === tspState.getSolvingState()) {
        consoleFns.appendToConsole('.')
      } else if (xhr.response.jobStatus === 'queued') {
        consoleFns.outputToConsole('In Queue')
      } else if (xhr.response.jobStatus === 'started') {
        consoleFns.outputToConsole('Quantum Computing in Progress!')
        consoleFns.outputToConsole('Solving')
      } else {
        consoleFns.outputToConsole(xhr.response.jobStatus)
      }
      tspState.setSolvingState(xhr.response.jobStatus)
      console.log(xhr.response.jobStatus)
    },
    (xhr) => {
      const tspSolveRequestObjects = {
        setters: setters,
        consoleFns: consoleFns
      }
      postSolve(xhr, key, tspSolveRequestObjects)
    },
    (xhr) => {
      consoleFns.outputToConsole('Something went wrong')
      console.log(xhr)
      consoleFns.outputToConsole(JSON.stringify(xhr))
      setters.setLoading(false)
      tspState.setIsLoading(false)
    },
    consoleFns.outputToConsole
  )
}

/**
 * postSolve is called after the call to the server is completed.
 * It will handle any (most) errors, set the grid to a solved state if solved,
 * and report back to the user through the console.
 * @param {object} xhr
 * @param {string} key one of the keys from Keys.js to identify the type of graph
 * (i.e. 'cities')
 * @param {object} functions contains functions such as setters and console functions
 */
function postSolve (xhr, key, functions) {
  const tspState = TSPstate.getInstance()
  const responseRoute = xhr.response.route

  const setters = functions.setters
  const consoleFns = functions.consoleFns

  if (xhr.status === 200) {
    if (responseRoute.length === 0 && xhr.response.output_message) {
      consoleFns.outputToConsole(xhr.response.output_message)
    } else {
      const waypoints = TSPutils.getWaypointsSinglePath(Graph[key], responseRoute)

      const graphLines = tspState.getLines(key)
      Object.keys(graphLines).forEach(index => {
        graphLines[index].fire('tspSolvedEvent', waypoints)
      })

      consoleFns.outputToConsole('The Travelling Salesperson can travel in the following order:')

      const idMapping = Graph[key].idMapping
      const length = responseRoute.length

      const firstNode = responseRoute[0]
      const firstNodeName = idMapping[firstNode]
      consoleFns.outputToConsole(`(We arbitrarily pick ${firstNodeName} as the starting node.)`)

      for (let i = 0; i < length + 1; i++) {
        const currentRoute = responseRoute[i % length]
        let solutionString = `${i + 1}. ${idMapping[currentRoute]}`
        if (i < length) {
          solutionString += ' ->'
        }
        consoleFns.outputToConsole(solutionString)
      }
    }

    setters.setIsPathSolved(true)
    tspState.setIsPathSolved(key, true)
  } else if (xhr.status === 400) {
    consoleFns.outputToConsole(xhr.response.error)
  } else {
    consoleFns.outputToConsole(xhr.status, xhr.statusText)
  }
  setters.setLoading(false)
  tspState.setIsLoading(false)
}

export default tspSolveRequest
