# Copyright 2020 D-Wave Systems Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This code includes an implementation of the algorithm described in Ikeda,
# K., Nakamura, Y. & Humble, T.S. Application of Quantum Annealing to Nurse
# Scheduling Problem. Sci Rep 9, 12837 (2019).
# https://doi.org/10.1038/s41598-019-49172-3, © The Author(s) 2019, use of
# which is licensed under a Creative Commons Attribution 4.0 International
# License (To view a copy of this license, visit
# http://creativecommons.org/licenses/by/4.0/).

# (2020)
# Modifications have been made
# by Diversifying Talent in Quantum Computing, Geering Up, UBC
#
# Modifications were made to enable the tool to be callable
# as a background process

from dwave.system import LeapHybridSampler, DWaveSampler
from dimod import BinaryQuadraticModel
from collections import defaultdict
from copy import deepcopy
import numpy as np


def main(token=None, n_nurses=3, n_days=11, nurses_per_day=1):
    """
    Takes a number of nurses, a number of days, and a wanted capacity
    of nurses per day.
    Also takes in a Dwave Authentication Token.
    Returns its best try at assigning nurses properly to the schedule required.
    One can think of the output as being a grid of size row x col,
    with a desired number of Xs in any column, while avoiding neighbouring
    Xs in any row.

    This runs on the Dwave Hybrid Sampler.
    The solution will be fast and good, but relatively expensive on Dwave
    allowed minutes.

    This code includes an implementation of the algorithm described in Ikeda,
    K., Nakamura, Y. & Humble, T.S. Application of Quantum Annealing to Nurse
    Scheduling Problem. Sci Rep 9, 12837 (2019).
    `DOI: 10.1038/s41598-019-49172-3 <https://doi.org/10.1038/s41598-019-49172-3>`_,
    © The Author(s) 2019, use of
    which is licensed under a Creative Commons Attribution 4.0 International
    License

    :param n_nurses: The number of nurses as an integer (number of rows in solution)

    :param n_days: The number of days as an integer (number of columns in solution)

    :param nurses_per_day: The number of desired nurses per day, an integer
        (desired number of Xs in any given column)

    :param token: The Dwave token to be used.
        This should be a string, in the format used on the dwave leap website.

    :return: Returns a dictionary. Keys supported:

        * "Size" a string describing the problem size
        * "Energy" a string describing the energy of the solution
        * "HardNurseConstraint" a string describing the hard nurse constraint energy
        * "HardShiftConstraint" a string describing the hard shift constraint energy
        * "n_days" an integer - the number of days (columns) of the solution
        * "n_nurses" an integer - the number of nurses (rows) of the solution
        * "schedule" - A 2-dimensional array of integers. Lists the exact days each nurse works (The marked columns for each row).
    
    """
    # Overall model variables: problem size
    # binary variable q_nd is the assignment of nurse n to day d
    n_nurses = n_nurses      # count nurses n = 1 ... n_nurses
    n_days = n_days       # count scheduling days as d = 1 ... n_days
    size = n_days * n_nurses

    print("solving with "+str(n_nurses)+" and "+str(n_days)+" nurses and days")

    # Parameters for hard nurse constraint
    # a is a positive correlation coefficient for implementing the hard nurse
    # constraint - value provided by Ikeda, Nakamura, Humble
    a = 3.5

    # Parameters for hard shift constraint
    # Hard shift constraint: at least one nurse working every day
    # Lagrange parameter, for hard shift constraint, on workforce and effort
    lagrange_hard_shift = 1.3
    # workforce = 1     # Workforce function W(d) - set to a constant for now
    workforce = nurses_per_day    # Workforce function W(d)
    effort = 1        # Effort function E(n) - set to a constant for now

    # Parameters for soft nurse constraint
    # Soft nurse constraint: all nurses should have approximately even work
    #                        schedules
    # Lagrange parameter, for shift constraints, on work days is called gamma
    # in the paper
    # Minimum duty days 'min_duty_days' - the number of work days that each
    # nurse wants
    # to be scheduled. At present, each will do the minimum on average.
    # The parameter gamma's value suggested by Ikeda, Nakamura, Humble
    lagrange_soft_nurse = 0.3      # Lagrange parameter for soft nurse, gamma
    preference = 1                 # preference function - constant for now
    # min_duty_days = int(n_days/n_nurses)
    min_duty_days = int(n_days*workforce/n_nurses)


    # Find composite index into 1D list for (nurse_index, day_index)
    def get_index(nurse_index, day_index):
        return nurse_index * n_days + day_index


    # Inverse of get_index - given a composite index in a 1D list, return the
    # nurse_index and day_index
    def get_nurse_and_day(index):
        nurse_index, day_index = divmod(index, n_days)
        return nurse_index, day_index


    # Hard nurse constraint: no nurse works two consecutive days
    # It does not have Lagrange parameter - instead, J matrix
    # symmetric, real-valued interaction matrix J, whereas all terms are
    # a or zero.
    # composite indices i(n, d) and j(n, d) as functions of n and d
    # J_i(n,d)j(n,d+1) = a and 0 otherwise.
    J = defaultdict(int)
    for nurse in range(n_nurses):
        for day in range(n_days - 1):
            nurse_day_1 = get_index(nurse, day)
            nurse_day_2 = get_index(nurse, day+1)
            J[nurse_day_1, nurse_day_2] = a

    # Q matrix assign the cost term, the J matrix
    Q = deepcopy(J)

    # Hard shift constraint: at least one nurse working every day
    # The sum is over each day.
    # This constraint tries to make (effort * sum(q_i)) equal to workforce,
    # which is set to a constant in this implementation, so that one nurse
    # is working each day.
    # Overall hard shift constraint:
    # lagrange_hard_shift * sum_d ((sum_n(effort * q_i(n,d)) - workforce) ** 2)
    #
    # with constant effort and constant workforce:
    # = lagrange_hard_shift * sum_d ( effort * sum_n q_i(n,d) - workforce ) ** 2
    # = lagrange_hard_shift * sum_d [ effort ** 2 * (sum_n q_i(n,d) ** 2)
    #                              - 2 effort * workforce * sum_n q_i(n,d)
    #                              + workforce ** 2 ]
    # The constant term is moved to the offset, below, right before we solve
    # the QUBO
    #
    # Expanding and merging the terms ( m is another sum over n ):
    # lagrange_hard_shift * (effort ** 2 - 2 effort * workforce) *
    # sum_d sum_n q_i(n,d)
    # + lagrange_hard_shift * effort ** 2 * sum_d sum_m sum_n q_i(n,d) q_j(m, d) #

    # Diagonal terms in hard shift constraint, without the workforce**2 term
    for nurse in range(n_nurses):
        for day in range(n_days):
            ind = get_index(nurse, day)
            Q[ind, ind] += lagrange_hard_shift * (effort ** 2 - (2 * workforce * effort))

    # Off-diagonal terms in hard shift constraint
    # Include only the same day, across nurses
    for day in range(n_days):
        for nurse1 in range(n_nurses):
            for nurse2 in range(nurse1 + 1, n_nurses):

                ind1 = get_index(nurse1, day)
                ind2 = get_index(nurse2, day)
                Q[ind1, ind2] += 2 * lagrange_hard_shift * effort ** 2

    # Soft nurse constraint: all nurses should have approximately even work
    #                        schedules
    # This constraint tries to make preference * sum(q_i) equal to min_duty_days,
    # so that the nurses have the same number of days. The sum of the q_i,
    # over the number of days, is each nurse's number of days worked in the
    # schedule.
    # Overall soft nurse constraint:
    # lagrange_soft_nurse * sum_n ((sum_d(preference * q_i(n,d)) - min_duty_days) ** 2)
    # with constant preference and constant min_duty_days:
    # = lagrange_soft_nurse * sum_n ( preference * sum_d q_i(n,d) - min_duty_days ) ** 2
    # = lagrange_soft_nurse * sum_n [ preference ** 2 * (sum_d q_i(n,d) ** 2)
    #                              - 2 preference * min_duty_days * sum_d q_i(n,d)
    #                              + min_duty_days ** 2 ]
    # The constant term is moved to the offset, below, right before we solve
    # the QUBO
    #
    # The square of the the sum_d term becomes:
    # Expanding and merging the terms (d1 and d2 are sums over d):
    # = lagrange_soft_nurse * (preference ** 2 - 2 preference * min_duty_days) * sum_n sum_d q_i(n,d)
    # + lagrange_soft_nurse * preference ** 2 * sum_n sum_d1 sum_d2 q_i(n,d1)
    #                      * q_j(n, d2)

    # Diagonal terms in soft nurse constraint, without the min_duty_days**2 term
    for nurse in range(n_nurses):
        for day in range(n_days):
            ind = get_index(nurse, day)
            Q[ind, ind] += lagrange_soft_nurse * (preference ** 2 - (2 * min_duty_days * preference))

    # Off-diagonal terms in soft nurse constraint
    # Include only the same nurse, across days
    for nurse in range(n_nurses):
        for day1 in range(n_days):
            for day2 in range(day1 + 1, n_days):

                ind1 = get_index(nurse, day1)
                ind2 = get_index(nurse, day2)
                Q[ind1, ind2] += 2 * lagrange_soft_nurse * preference ** 2

    # Solve the problem, and use the offset to scale the energy
    e_offset = (lagrange_hard_shift * n_days * workforce ** 2) + (lagrange_soft_nurse * n_nurses * min_duty_days ** 2)
    bqm = BinaryQuadraticModel.from_qubo(Q, offset=e_offset)
    
    endpoint = 'https://cloud.dwavesys.com/sapi/'
    client = 'qpu'
    #solver = 'DW_2000Q_5' # Use this to specify a solver, but leave commented out to let D-Wave's system autochoose a solver
    try:
        qpu_sampler = DWaveSampler(
            client=client,
            endpoint=endpoint,
            token=token)
            #solver=solver)
    except:
        return {'error':'Token not accepted'}
    sampler = LeapHybridSampler(token=token)
    results = sampler.sample(bqm, qpu_sampler=qpu_sampler)

    # Get the results
    ret_value = dict()
    smpl = results.first.sample
    energy = results.first.energy
    print("Size ", size)
    print("Energy ", energy)

    ret_value["Size"] = "Size " + str(size)
    ret_value["Energy"] = "Energy " + str(energy)


    # Check the results by doing the sums directly
    # J sum
    # sum_j = 0
    # for i in range(size):
    #     for j in range(size):
    #         sum_j += J[i, j] * smpl[i] * smpl[j]
    # print("Checking Hard nurse constraint ", sum_j)

    # Removed that method, as it created too many empty elements in J
    # This one only iterates over non-zero values in J

    sum_j = 0
    for (i, j), val in J.items():
        sum_j += val * smpl[i] * smpl[j]
    print("Checking Hard nurse constraint ", sum_j)

    ret_value["HardNurseConstraint"] = "Checking Hard nurse constraint " + str(sum_j)

    # workforce sum
    sum_w = 0
    for d in range(n_days):
        sum_n = 0
        for n in range(n_nurses):
            sum_n += effort * smpl[get_index(n, d)]
        sum_w += lagrange_hard_shift * (sum_n - workforce) * (sum_n - workforce)
    print("Checking Hard shift constraint ", sum_w)

    ret_value["HardShiftConstraint"] = "Checking Hard shift constraint " + str(sum_w)

    # min_duty_days sum
    sum_f = 0
    for n in range(n_nurses):
        sum_d = 0
        for d in range(n_days):
            sum_d += preference * smpl[get_index(n, d)]
        sum_f += lagrange_soft_nurse * (sum_d - min_duty_days) * (sum_d - min_duty_days)
    print("Checking Soft nurse constraint ", sum_f)

    # Graphics
    sched = [get_nurse_and_day(j) for j in range(size) if smpl[j] == 1]
    str_header_for_output = " " * 11
    str_header_for_output += "  ".join(map(str, range(n_days)))
    print(str_header_for_output)

    schedule_mat = np.zeros((n_nurses, n_days))
    for n in range(n_nurses):
        str_row = ""
        for d in range(n_days):
            if (n, d) in sched:
                outcome = "X"
                schedule_mat[n, d] = 1
            else:
                outcome = " "

            if d > 9:
                outcome += " "
            str_row += "  " + outcome
        print("Nurse ", n, str_row)

    ret_value["n_days"] = n_days
    ret_value["n_nurses"] = n_nurses
    ret_value["schedule"] = [ np.where(row == 1)[0].tolist() for row in schedule_mat ]
    # print(ret_value)
    return ret_value
