// SPDX-License-Identifier: MIT
/*
 * (C) Copyright 2020
 * Diversifying Talent in Quantum Computing, Geering Up, UBC
 */

import L from 'leaflet'
import TSPutils from './TSPutils.js'
import Keys from './Keys.js'

class TSPstate {
  static instance = null

  isCitiesFirstRoundRoutingCall = true
  isVancouverFirstRoundRoutingCall = true

  isLoading = true

  isCitiesPathSolved = false
  isVancouverPathSolved = false

  solvingState = ''

  citiesCallsPending = new Set()
  vancouverCallsPending = new Set()

  /**
   * 'Main Map Markers' refers to the Markers
   * that are drawn onto the 'Main Map' which
   * is the non-fullScreen map for TSP.
   *
   * These objects (...MainMapMarkers) map sourceKeys
   * (i.e. "UBC campus" which is an example given in RoutingMachine.js)
   * to L.marker objects
   *
   * L.marker documentation:
   * https://leafletjs.com/reference-1.6.0.html#marker
   */
  citiesMainMapMarkers = {}
  vancouverMainMapMarkers = {}

  citiesMap = null
  vancouverMap = null

  citiesState = {
    lat: 44.5260,
    lng: -105.2551,
    zoom: 3
  }

  vancouverState = {
    lat: 49.246292,
    lng: -122.999000,
    zoom: 10
  }

  /**
   * These objects (...Route) map waypointKeys (in RoutingMachine.js)
   * i.e. "["UBC campus","SFU campus"]"
   * to L.Routing.plan objects
   *
   * L.Routing.plan documentation:
   * https://www.liedman.net/leaflet-routing-machine/api/#l-routing-plan
   */
  citiesRoute = {}
  vancouverRoute = {}

  /**
   * These objects (...LineRoute) map numbers (as indexes)
   * to the primary route received in the callback from the
   * PersistentGraph.js > requestRoute() call
   * (accessed like <IRoute[]>[0] in RoutingMachine.js > getRoutingCallback())
   *
   * IRoute documentation:
   * https://www.liedman.net/leaflet-routing-machine/api/#iroute
   */
  citiesLineRoute = {}
  vancouverLineRoute = {}

  /**
   * These objects (...Lines) map numbers (as indexes)
   * to L.Routing.line instances
   */
  citiesLines = {}
  vancouverLines = {}

  /**
   * These Sets (...SelectedNodeIds) store the
   * (number) nodeIds of the markers that are
   * selected on the TSP map
   */
  citiesSelectedNodeIds = new Set()
  vancouverSelectedNodeIds = new Set()

  /**
   * These Sets (...SelectedMarkers) store the
   * (string) sourceKeys
   * (i.e. "UBC campus" which is an example given in RoutingMachine.js)
   * of the markers that are selected on the
   * TSP map
   */
  citiesSelectedMarkers = new Set()
  vancouverSelectedMarkers = new Set()

  /**
   * These Sets (...MarkerSourceKeys) store
   * the (string) sourceKeys
   * (i.e. "UBC campus" which is an example given in RoutingMachine.js)
   * of markers that are created
   */
  citiesMainMapMarkerSourceKeys = new Set()
  vancouverMainMapMarkerSourceKeys = new Set()

  fullScreenCitiesMarkerSourceKeys = new Set()
  fullScreenVancouverMarkerSourceKeys = new Set()

  fullScreen = false

  citiesSolvedRouteIndexes = new Set()
  vancouverSolvedRouteIndexes = new Set()

  componentsUpdated = 0

  /**
   * The components referred to are the below:
   * 1. TravellingSalesperson.js > keys
   * 2. TravellingSalesperson.js > waypoints
   */
  componentsThatNeedUpdating = 2

  static getInstance () {
    if (TSPstate.instance === null) {
      TSPstate.instance = new TSPstate()
    }

    return this.instance
  }

  getIsFirstRoundRoutingCall (key) {
    let isFirstRoundRoutingCall = null
    switch (key) {
      case Keys.CITIES:
        isFirstRoundRoutingCall = this.getIsCitiesFirstRoundRoutingCall()
        break
      case Keys.VANCOUVER:
        isFirstRoundRoutingCall = this.getIsVancouverFirstRoundRoutingCall()
        break
      default:
        break
    }

    return isFirstRoundRoutingCall
  }

  getIsCitiesFirstRoundRoutingCall () {
    return this.isCitiesFirstRoundRoutingCall
  }

  getIsVancouverFirstRoundRoutingCall () {
    return this.isVancouverFirstRoundRoutingCall
  }

  getIsLoading () {
    return this.isLoading
  }

  getIsPathSolved (key) {
    let isPathSolved = null
    switch (key) {
      case Keys.CITIES:
        isPathSolved = this.getIsCitiesPathSolved()
        break
      case Keys.VANCOUVER:
        isPathSolved = this.getIsVancouverPathSolved()
        break
      default:
        break
    }

    return isPathSolved
  }

  getIsCitiesPathSolved () {
    return this.isCitiesPathSolved
  }

  getIsVancouverPathSolved () {
    return this.isVancouverPathSolved
  }

  getSolvingState () {
    return this.solvingState
  }

  getCallsPending (key) {
    let callsPending = null
    switch (key) {
      case Keys.CITIES:
        callsPending = this.getCitiesCallsPending()
        break
      case Keys.VANCOUVER:
        callsPending = this.getVancouverCallsPending()
        break
      default:
        break
    }

    return callsPending
  }

  getCitiesCallsPending () {
    return this.citiesCallsPending
  }

  getVancouverCallsPending () {
    return this.vancouverCallsPending
  }

  getMainMapMarkers (key) {
    let mainMapMarkers = null
    switch (key) {
      case Keys.CITIES:
        mainMapMarkers = this.getCitiesMainMapMarkers()
        break
      case Keys.VANCOUVER:
        mainMapMarkers = this.getVancouverMainMapMarkers()
        break
      default:
        break
    }

    return mainMapMarkers
  }

  getCitiesMainMapMarkers () {
    return this.citiesMainMapMarkers
  }

  getVancouverMainMapMarkers () {
    return this.vancouverMainMapMarkers
  }

  getCitiesMap () {
    return this.citiesMap
  }

  getVancouverMap () {
    return this.vancouverMap
  }

  getMapState (key) {
    let mapState = null
    switch (key) {
      case Keys.CITIES:
        mapState = this.getCitiesState()
        break
      case Keys.VANCOUVER:
        mapState = this.getVancouverState()
        break
      default:
        break
    }

    return mapState
  }

  getCitiesState () {
    return this.citiesState
  }

  getVancouverState () {
    return this.vancouverState
  }

  getRoute (key) {
    let route = null
    switch (key) {
      case Keys.CITIES:
        route = this.getCitiesRoute()
        break
      case Keys.VANCOUVER:
        route = this.getVancouverRoute()
        break
      default:
        break
    }

    return route
  }

  getCitiesRoute () {
    return this.citiesRoute
  }

  getVancouverRoute () {
    return this.vancouverRoute
  }

  getLineRoute (key) {
    let lineRoute = null
    switch (key) {
      case Keys.CITIES:
        lineRoute = this.getCitiesLineRoute()
        break
      case Keys.VANCOUVER:
        lineRoute = this.getVancouverLineRoute()
        break
      default:
        break
    }

    return lineRoute
  }

  getCitiesLineRoute () {
    return this.citiesLineRoute
  }

  getVancouverLineRoute () {
    return this.vancouverLineRoute
  }

  getLines (key) {
    let lines = null
    switch (key) {
      case Keys.CITIES:
        lines = this.getCitiesLines()
        break
      case Keys.VANCOUVER:
        lines = this.getVancouverLines()
        break
      default:
        break
    }

    return lines
  }

  getCitiesLines () {
    return this.citiesLines
  }

  getVancouverLines () {
    return this.vancouverLines
  }

  getSelectedNodeIds (key) {
    let selectedNodes = null
    switch (key) {
      case Keys.CITIES:
        selectedNodes = this.getCitiesSelectedNodeIds()
        break
      case Keys.VANCOUVER:
        selectedNodes = this.getVancouverSelectedNodeIds()
        break
      default:
        break
    }

    return selectedNodes
  }

  getCitiesSelectedNodeIds () {
    return this.citiesSelectedNodeIds
  }

  getVancouverSelectedNodeIds () {
    return this.vancouverSelectedNodeIds
  }

  getSelectedMarkers (key) {
    let selectedMarkers = null
    switch (key) {
      case Keys.CITIES:
        selectedMarkers = this.getCitiesSelectedMarkers()
        break
      case Keys.VANCOUVER:
        selectedMarkers = this.getVancouverSelectedMarkers()
        break
      default:
        break
    }

    return selectedMarkers
  }

  getCitiesSelectedMarkers () {
    return this.citiesSelectedMarkers
  }

  getVancouverSelectedMarkers () {
    return this.vancouverSelectedMarkers
  }

  getMarkerSourceKeys (key) {
    let markerSourceKeys = null
    if (this.getFullScreen()) {
      markerSourceKeys = this.getFullScreenMarkerSourceKeys(key)
    } else {
      markerSourceKeys = this.getMainMapMarkerSourceKeys(key)
    }

    return markerSourceKeys
  }

  getMainMapMarkerSourceKeys (key) {
    let markerSourceKeys = null
    switch (key) {
      case Keys.CITIES:
        markerSourceKeys = this.getCitiesMainMapMarkerSourceKeys()
        break
      case Keys.VANCOUVER:
        markerSourceKeys = this.getVancouverMainMapMarkerSourceKeys()
        break
      default:
        break
    }

    return markerSourceKeys
  }

  getCitiesMainMapMarkerSourceKeys () {
    return this.citiesMainMapMarkerSourceKeys
  }

  getVancouverMainMapMarkerSourceKeys () {
    return this.vancouverMainMapMarkerSourceKeys
  }

  getFullScreenMarkerSourceKeys (key) {
    let fullScreenMarkerSourceKeys = null
    switch (key) {
      case Keys.CITIES:
        fullScreenMarkerSourceKeys = this.getFullScreenCitiesMarkerSourceKeys()
        break
      case Keys.VANCOUVER:
        fullScreenMarkerSourceKeys = this.getFullScreenVancouverMarkerSourceKeys()
        break
      default:
        break
    }

    return fullScreenMarkerSourceKeys
  }

  getFullScreenCitiesMarkerSourceKeys () {
    return this.fullScreenCitiesMarkerSourceKeys
  }

  getFullScreenVancouverMarkerSourceKeys () {
    return this.fullScreenVancouverMarkerSourceKeys
  }

  getFullScreen () {
    return this.fullScreen
  }

  getSolvedRouteIndexes (key) {
    let solvedRouteIndexes = null
    switch (key) {
      case Keys.CITIES:
        solvedRouteIndexes = this.getCitiesSolvedRouteIndexes()
        break
      case Keys.VANCOUVER:
        solvedRouteIndexes = this.getVancouverSolvedRouteIndexes()
        break
      default:
        break
    }
    return solvedRouteIndexes
  }

  getCitiesSolvedRouteIndexes () {
    return this.citiesSolvedRouteIndexes
  }

  getVancouverSolvedRouteIndexes () {
    return this.vancouverSolvedRouteIndexes
  }

  getComponentsUpdated () {
    return this.componentsUpdated
  }

  getComponentsThatNeedUpdating () {
    return this.componentsThatNeedUpdating
  }

  getFirstRoute (key) {
    let firstRoute = null
    switch (key) {
      case Keys.CITIES:
        firstRoute = this.getCitiesFirstRoute()
        break
      case Keys.VANCOUVER:
        firstRoute = this.getVancouverFirstRoute()
        break
      case Keys.FLOWERS:
        console.log('TODO: implement getFirstRoute() Flowers case')
        break
      default:
        break
    }

    return firstRoute
  }

  getCitiesFirstRoute () {
    const firstKey = Object.keys(this.getCitiesRoute())[0]
    return this.getCitiesRoute()[firstKey]
  }

  getVancouverFirstRoute () {
    const firstKey = Object.keys(this.getVancouverRoute())[0]
    return this.getVancouverRoute()[firstKey]
  }

  setIsFirstRoundRoutingCall (graphKey, value) {
    switch (graphKey) {
      case Keys.CITIES:
        this.setIsCitiesFirstRoundRoutingCall(value)
        break
      case Keys.VANCOUVER:
        this.setIsVancouverFirstRoundRoutingCall(value)
        break
      default:
        break
    }
  }

  setIsCitiesFirstRoundRoutingCall (value) {
    this.isCitiesFirstRoundRoutingCall = value
  }

  setIsVancouverFirstRoundRoutingCall (value) {
    this.isVancouverFirstRoundRoutingCall = value
  }

  setIsLoading (value) {
    this.isLoading = value
  }

  setIsPathSolved (graphKey, value) {
    switch (graphKey) {
      case Keys.CITIES:
        this.setIsCitiesPathSolved(value)
        break
      case Keys.VANCOUVER:
        this.setIsVancouverPathSolved(value)
        break
      default:
        break
    }
  }

  setIsCitiesPathSolved (value) {
    this.isCitiesPathSolved = value
  }

  setIsVancouverPathSolved (value) {
    this.isVancouverPathSolved = value
  }

  setSolvingState (value) {
    this.solvingState = value
  }

  setCallsPending (graphKey, value) {
    switch (graphKey) {
      case Keys.CITIES:
        this.setCitiesCallsPending(value)
        break
      case Keys.VANCOUVER:
        this.setVancouverCallsPending(value)
        break
      default:
        break
    }
  }

  setCitiesCallsPending (value) {
    this.citiesCallsPending = value
  }

  setVancouverCallsPending (value) {
    this.vancouverCallsPending = value
  }

  setCitiesMainMapMarkers (value) {
    this.citiesMainMapMarkers = value
  }

  setMap (graphKey, value) {
    switch (graphKey) {
      case Keys.CITIES:
        this.setCitiesMap(value)
        break
      case Keys.VANCOUVER:
        this.setVancouverMap(value)
        break
      default:
        break
    }
  }

  setCitiesMap (value) {
    this.citiesMap = value
  }

  setVancouverMap (value) {
    this.vancouverMap = value
  }

  updateCitiesState (newState) {
    this.citiesState = { ...this.citiesState, ...newState }
  }

  updateVancouverState (newState) {
    this.vancouverState = { ...this.vancouverState, ...newState }
  }

  setCitiesRoute (value) {
    this.citiesRoute = value
  }

  setVancouverRoute (value) {
    this.vancouverRoute = value
  }

  setCitiesLineRoute (value) {
    this.citiesLineRoute = value
  }

  setVancouverLineRoute (value) {
    this.vancouverLineRoute = value
  }

  setCitiesLines (value) {
    this.citiesLines = value
  }

  setVancouverLines (value) {
    this.vancouverLines = value
  }

  setSelectedNodeIds (graphKey, value) {
    switch (graphKey) {
      case Keys.CITIES:
        this.setCitiesSelectedNodeIds(value)
        break
      case Keys.VANCOUVER:
        this.setVancouverSelectedNodeIds(value)
        break
      default:
        break
    }
  }

  setCitiesSelectedNodeIds (value) {
    this.citiesSelectedNodeIds = value
  }

  setVancouverSelectedNodeIds (value) {
    this.vancouverSelectedNodeIds = value
  }

  setSelectedMarkers (graphKey, value) {
    switch (graphKey) {
      case Keys.CITIES:
        this.setCitiesSelectedMarkers(value)
        break
      case Keys.VANCOUVER:
        this.setVancouverSelectedMarkers(value)
        break
      default:
        break
    }
  }

  setCitiesSelectedMarkers (value) {
    this.citiesSelectedMarkers = value
  }

  setVancouverSelectedMarkers (value) {
    this.vancouverSelectedMarkers = value
  }

  setFullScreenMarkerSourceKeys (graphKey, value) {
    switch (graphKey) {
      case Keys.CITIES:
        this.setFullScreenCitiesMarkerSourceKeys(value)
        break
      case Keys.VANCOUVER:
        this.setFullScreenVancouverMarkerSourceKeys(value)
        break
      default:
        break
    }
  }

  setFullScreenCitiesMarkerSourceKeys (value) {
    this.fullScreenCitiesMarkerSourceKeys = value
  }

  setFullScreenVancouverMarkerSourceKeys (value) {
    this.fullScreenVancouverMarkerSourceKeys = value
  }

  setFullScreen (value) {
    this.fullScreen = value
  }

  setSolvedRouteIndexes (graphKey, value) {
    switch (graphKey) {
      case Keys.CITIES:
        this.setCitiesSolvedRouteIndexes(value)
        break
      case Keys.VANCOUVER:
        this.setVancouverSolvedRouteIndexes(value)
        break
      default:
        break
    }
  }

  setCitiesSolvedRouteIndexes (value) {
    this.citiesSolvedRouteIndexes = value
  }

  setVancouverSolvedRouteIndexes (value) {
    this.vancouverSolvedRouteIndexes = value
  }

  setComponentsUpdated (value) {
    this.componentsUpdated = value
  }

  setComponentsThatNeedUpdating (value) {
    this.componentsThatNeedUpdating = value
  }

  /**
   * This is the event handler for the 'reset' event. The event
   * listener is attached to newly created red lines in TSPstate.js > onTSPsolved().
   * Once the Travelling Salesperson Problem (TSP) is solved, lines along the
   * Travelling Salesperson's path will be replaced by red lines and so must have a 'reset'
   * event to set back to blue lines. That is the purpose of this function.
   * @param {object} lineInfo contains information about the line that 'reset' has
   * been called on
   * @param {object} tspSolvedEventListenerInfo contains values needed to pass to the
   * 'tspSolvedEvent' event listener
   * @param {string} key one of the keys from Keys.js to identify the type of graph
   * (i.e. 'cities')
   */
  onReset (lineInfo, tspSolvedEventListenerInfo, key) {
    const oldLine = lineInfo.oldLine
    const index = lineInfo.index
    const map = lineInfo.map
    const waypoints = lineInfo.waypoints

    const routes = tspSolvedEventListenerInfo.routes

    map.leafletElement.removeLayer(oldLine)

    let newLine = L.Routing.line(this.getLineRoute(key)[index], {
      styles: TSPutils.getRoutingLineStyles('bluePane', TSPutils.getGeeringupPrimaryColor())
    })

    const tspSolvedEventListener = (waypointsInSolution) => {
      const lineInfo = {
        line: newLine,
        lineWaypoints: waypoints,
        waypointsInSolution: waypointsInSolution,
        map: map,
        routes: routes,
        index: index
      }

      this.onTSPsolved(lineInfo, key)
    }

    newLine.addEventListener('tspSolvedEvent', tspSolvedEventListener)
    newLine = newLine.addTo(map.leafletElement)

    this.getLines(key)[index] = newLine
  }

  /**
   * This is the event handler for the 'tspSolvedEvent' event. The event
   * listener is attached to newly created (blue) lines in RoutingMachine.js and
   * to newly created blue lines in TSPstate.js > onReset(). (In onReset(),
   * red lines are replaced with blue lines since blue is the default state of the line.)
   * This function searches for (blue) lines which have their endpoints in the Travelling
   * Salesperson's path and replaces them with red lines.
   * @param {object} lineInfo contains information about the line that 'tspSolvedEvent' has
   * been called on
   * @param {string} key one of the keys from Keys.js to identify the type of graph
   *  (i.e. 'cities')
   */
  onTSPsolved (lineInfo, key) {
    const line = lineInfo.line
    const lineWaypoints = lineInfo.lineWaypoints
    const waypointsInSolution = lineInfo.waypointsInSolution
    const map = lineInfo.map
    const routes = lineInfo.routes
    const index = lineInfo.index

    const keys = Object.keys(waypointsInSolution)
    for (let i = 0; i < keys.length; i++) {
      if (!TSPutils.isNonNegNumber(keys[i])) {
        break
      }

      const startWaypoint = waypointsInSolution[keys[i]].waypoint[0]
      const endWaypoint = waypointsInSolution[keys[i]].waypoint[1]

      if (TSPutils.doStartAndEndWaypointsMatch(lineWaypoints, startWaypoint, endWaypoint)) {
        this.getSolvedRouteIndexes(key).add(index)
        map.leafletElement.removeLayer(line)

        let newLine = L.Routing.line(routes, {
          styles: TSPutils.getRoutingLineStyles('redPane', TSPutils.getGeeringupSecondaryColor())
        })
        const tspSolvedEventFn = (waypointsInSolution) => {
          const lineInfo = {
            line: newLine,
            lineWaypoints: lineWaypoints,
            waypointsInSolution: waypointsInSolution,
            map: map,
            routes: routes,
            index: index
          }
          this.onTSPsolved(lineInfo, key)
        }
        const tspOnResetEventFn = () => {
          const lineInfo = {
            oldLine: newLine,
            index: index,
            map: map,
            waypoints: lineWaypoints
          }
          const tspSolvedEventListenerInfo = {
            routes: routes
          }
          this.onReset(lineInfo, tspSolvedEventListenerInfo, key)
        }

        newLine.addEventListener('tspSolvedEvent', tspSolvedEventFn)
        newLine.addEventListener('reset', tspOnResetEventFn)
        newLine = newLine.addTo(map.leafletElement)

        this.getLines(key)[index] = newLine
      }
    }
  }

  resetGraphStates (key) {
    this.setSelectedNodeIds(key, new Set())
    this.setSelectedMarkers(key, new Set())
    this.setSolvedRouteIndexes(key, new Set())
  }
}

export default TSPstate
