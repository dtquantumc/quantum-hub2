// SPDX-License-Identifier: MIT
/*
 * (C) Copyright 2020
 * Diversifying Talent in Quantum Computing, Geering Up, UBC
 */

import React from 'react'

import './latticeColourer.css'

const fillColours = ['white', '#d3d3d3']
const marbleColours = ['#a41149', '#5ed0eb']

function Hexagon (props) {
  const x = props.x
  const y = props.y
  const h = props.h
  const w = props.w
  const isOn = props.isOn
  const onClick = props.onClick

  const fillC = (isOn ? fillColours[1] : fillColours[0])
  return (
    <polygon
      className='hexagon'
      points={
        (x + (1 / 2) * w) + ',' + y + ' ' +
        (x + w) + ',' + (y + (1 / 3) * h) + ' ' +
        (x + w) + ',' + (y + h) + ' ' +
        (x + (1 / 2) * w) + ',' + (y + (4 / 3) * h) + ' ' +
        (x) + ',' + (y + h) + ' ' +
        (x) + ',' + (y + (1 / 3) * h) + ' '
      }
      key={x + ' ' + y}
      strokeWidth='2'
      stroke='black'
      strokeOpacity={isOn ? 1 : 0.3}
      fill={fillC}
      onClick={onClick}
    />
  )
}

function Hexagons (props) {
  const lattice = props.lattice
  const setLattice = props.setLattice
  const mode = props.mode
  const hexWidth = props.hexWidth
  const hexHeight = props.hexHeight

  return (
    lattice.map((row, i) => {
      return (
        row.map((e, j) => {
          const x = (j + (i % 2 === 1 ? 0.5 : 0)) * hexWidth
          const y = (i * hexHeight)
          if (mode !== 'grid' && !e) return ''
          return (
            <Hexagon
              x={x + 1}
              y={y + 1}
              key={x + ' ' + y}
              h={hexHeight}
              w={hexWidth}
              isOn={e ? 1 : 0}
              onClick={() => {
                var newLattice = lattice.map(row => [...row])
                if (mode === 'grid') {
                  if (lattice[i][j]) {
                    newLattice[i][j] = 0
                  } else {
                    newLattice[i][j] = 1
                  }
                  setLattice(newLattice)
                } else if (mode === 'marble' && lattice[i][j]) {
                  newLattice[i][j] = -lattice[i][j]
                  setLattice(newLattice)
                }
              }}
            />
          )
        })
      )
    })
  )
}

function MarblesAndLines (props) {
  const lattice = props.lattice
  const hexWidth = props.hexWidth
  const hexHeight = props.hexHeight
  const conflicts = props.conflicts

  var ci = 0

  const returnVal = (
    lattice.map((row, i) => {
      return (
        row.map((e, j) => {
          const x = (j + (i % 2 === 1 ? 1 : 0.5)) * hexWidth
          const y = (i + 2 / 3) * hexHeight
          var fillC
          if (!e) {
            return ''
          } else if (e < 0) {
            fillC = marbleColours[0]
          } else {
            fillC = marbleColours[1]
          }

          var lineEnds = []

          while (
            ci < conflicts.length &&
            conflicts[ci][0] === i &&
            conflicts[ci][1] === j
          ) {
            const ii = conflicts[ci][2]
            const jj = conflicts[ci][3]
            lineEnds.push([
              (jj + (ii % 2 === 1 ? 1 : 0.5)) * hexWidth,
              (ii + 2 / 3) * hexHeight
            ])
            ci++
          }

          return (
            <React.Fragment key='hexfrag'>
              {
                lineEnds.map(([x2, y2]) => {
                  return (
                    <line
                      className='line'
                      key={x + ' ' + y + ' ' + x2 + ' ' + y2}
                      x1={x + 1}
                      y1={y + 1}
                      x2={x2 + 1}
                      y2={y2 + 1}
                      stroke='black'
                      strokeWidth='4'
                    />
                  )
                })
              }
              <circle
                className='innerMarble'
                key={x + ' ' + y + ' circ'}
                cx={x + 1}
                cy={y + 1}
                r={hexWidth / 6}
                fill={fillC}
                stroke='black'
                strokeWidth='2'
              />
            </React.Fragment>
          )
        })
      )
    })
  )
  return (returnVal)
}

/**
 * Draws the whole lattice grid, depending on the lattice given.
 * @prop {Array(Array(Int))} lattice - A lattice object :D
 */
function HexGrid (props) {
  const [lattice, setLattice] = [props.lattice, props.setLattice]
  const mode = props.mode
  const maxW = props.width - 2
  const conflicts = props.conflicts

  // Calculate the width and height of each hexagon
  var width = 0
  var height = lattice.length
  for (var i = 0; i < height; ++i) {
    const w = lattice[i].length + (i % 2 === 1 ? 0.5 : 0)
    width = Math.max(width, w)
  }
  // console.log(height)
  const hexWidth = maxW / (width)
  const hexHeight = 1.15470053838 * hexWidth * 0.75

  // Not sure if needed anymore
  document.documentElement.style.setProperty('--hexWidth', hexWidth + 'px')

  // Display all the polygons
  return (
    <div className='hexGrid'>
      <svg width={maxW + 2} height={hexHeight * (height + 0.333333) + 2}>
        <Hexagons
          hexWidth={hexWidth}
          hexHeight={hexHeight}
          lattice={lattice}
          setLattice={setLattice}
          mode={mode}
        />
        {mode !== 'grid' ? (
          <MarblesAndLines
            hexWidth={hexWidth}
            hexHeight={hexHeight}
            lattice={lattice}
            conflicts={conflicts}
            setLattice={setLattice}
            mode={mode}
          />
        )
          : ''}
      </svg>
    </div>
  )
}

export default HexGrid
