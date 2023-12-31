// SPDX-License-Identifier: MIT
/*
 * (C) Copyright 2020
 * Diversifying Talent in Quantum Computing, Geering Up, UBC
 */
import createBreakpoints from '@material-ui/core/styles/createBreakpoints'
const breakpoints = createBreakpoints({})

const nurseScheduleStyle = {
  badge: {
    backgroundColor: '#D96262'
  },
  geeringupTheme: {
    overrides: {
      MuiPickersCalendarHeader: {
        transitionContainer: {
          color: 'rgba(0, 0, 0, 0.87)'
        }
      },
      MuiPickersStaticWrapper: {
        staticWrapperRoot: {
          borderRadius: '6px',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          overflow: 'scroll'
        }
      },
      MuiPickersToolbar: {
        toolbar: {
          backgroundColor: '#87d3e4',
          [breakpoints.down('sm')]: {
            display: 'none'
          }
        }
      },
      MuiPickersToolbarButton: {
        toolbarBtn: {
          '&:focus': {
            color: 'inherit',
            background: 'transparent'
          }
        }
      },
      MuiPickersDay: {
        day: {
          color: 'rgb(21, 153, 191)'
        },
        daySelected: {
          '&, &:hover': {
            backgroundColor: '#87d3e4'
          }
        },
        dayDisabled: {
          color: 'rgba(80, 200, 235, 0.65)'
        },
        current: {
          color: 'rgba(0, 0, 0, 0.87)'
        }
      }
    }
  }
}

export default nurseScheduleStyle
