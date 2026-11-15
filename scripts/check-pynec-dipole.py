# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
#
# Copyright 2026 Tartanleaf.com Inc.

from importlib.metadata import version
from math import isfinite

from PyNEC import nec_context

FREQUENCY_MHZ = 14.2
SPAN_METRES = 10.03
HEIGHT_METRES = 10.0
RADIUS_METRES = 0.0008
SEGMENT_COUNT = 21
SOURCE_SEGMENT = 11
TOLERANCE_OHMS = 0.1

REFERENCES = {
    "free-space": complex(67.513, -33.263),
    "perfect-ground": complex(68.261, -50.672),
}


def run_case(name):
    perfect_ground = name == "perfect-ground"
    height = HEIGHT_METRES if perfect_ground else 0.0
    context = nec_context()
    geometry = context.get_geometry()
    geometry.wire(
        1,
        SEGMENT_COUNT,
        -SPAN_METRES / 2,
        0.0,
        height,
        SPAN_METRES / 2,
        0.0,
        height,
        RADIUS_METRES,
        1.0,
        1.0,
    )
    context.geometry_complete(1 if perfect_ground else 0)
    context.gn_card(1 if perfect_ground else -1, 0, 0, 0, 0, 0, 0, 0)
    context.ex_card(0, 1, SOURCE_SEGMENT, 0, 0, 1.0, 0, 0, 0, 0, 0)
    context.fr_card(0, 1, FREQUENCY_MHZ, 0)
    context.xq_card(0)

    result = complex(context.get_input_parameters(0).get_impedance()[0])
    expected = REFERENCES[name]
    if not (isfinite(result.real) and isfinite(result.imag) and result.real > 0):
        raise RuntimeError(f"{name} produced an invalid input impedance: {result}")
    if abs(result.real - expected.real) > TOLERANCE_OHMS:
        raise RuntimeError(f"{name} resistance differs from the reference: {result.real:.3f} ohms")
    if abs(result.imag - expected.imag) > TOLERANCE_OHMS:
        raise RuntimeError(f"{name} reactance differs from the reference: {result.imag:.3f} ohms")
    return result


free_space = run_case("free-space")
perfect_ground = run_case("perfect-ground")
print(f"PyNEC/NEC2++ {version('PyNEC')} agreed with both bounded reference cases.")
print(f"Free space: {free_space.real:.3f} {'-' if free_space.imag < 0 else '+'} j{abs(free_space.imag):.3f} ohms.")
print(
    f"Perfect ground: {perfect_ground.real:.3f} "
    f"{'-' if perfect_ground.imag < 0 else '+'} j{abs(perfect_ground.imag):.3f} ohms."
)
