"""Tests for the candidate -> verify fall chain and the simulator envelope."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from watchcare_edge.domain.models import TemporalFeatures
from watchcare_edge.pipeline.fall_candidate import FallCandidateEngine
from watchcare_edge.pipeline.risk_verifier import RiskVerifier
from watchcare_edge.simulator.event_simulator import build_simulated_envelope

FALL_FEATURES = TemporalFeatures(
    track_id="t1", window_ms=5000, max_vertical_drop=0.52,
    drop_duration_ms=420, torso_angle_deg=78.0, inactivity_ms=25_000,
)
SIT_DOWN_FEATURES = TemporalFeatures(
    track_id="t1", window_ms=5000, max_vertical_drop=0.20,
    drop_duration_ms=1500, torso_angle_deg=15.0, inactivity_ms=0,
)


class FallChainTest(unittest.TestCase):
    def test_fall_features_produce_verified_risk(self) -> None:
        candidate = FallCandidateEngine().evaluate(FALL_FEATURES, detected_at_ms=100)
        self.assertIsNotNone(candidate)
        self.assertIn("RAPID_VERTICAL_DROP", candidate.reasons)
        self.assertIn("TORSO_HORIZONTAL", candidate.reasons)
        verified = RiskVerifier().verify(candidate, FALL_FEATURES, verified_at_ms=200)
        self.assertIsNotNone(verified)
        self.assertEqual(verified.inactivity_ms, 25_000)

    def test_normal_sit_down_produces_no_candidate(self) -> None:
        candidate = FallCandidateEngine().evaluate(SIT_DOWN_FEATURES, detected_at_ms=100)
        self.assertIsNone(candidate)

    def test_candidate_without_inactivity_is_not_verified(self) -> None:
        # Fall-like drop, but the person got back up within 3 seconds.
        recovered = TemporalFeatures(
            track_id="t1", window_ms=5000, max_vertical_drop=0.52,
            drop_duration_ms=420, torso_angle_deg=78.0, inactivity_ms=3_000,
        )
        candidate = FallCandidateEngine().evaluate(recovered, detected_at_ms=100)
        self.assertIsNotNone(candidate)
        verified = RiskVerifier().verify(candidate, recovered, verified_at_ms=200)
        self.assertIsNone(verified)


class SimulatorEnvelopeTest(unittest.TestCase):
    def test_envelope_matches_contracts_shape(self) -> None:
        envelope = build_simulated_envelope()
        required = {
            "schemaVersion", "eventId", "edgeId", "cameraId", "careSubjectId",
            "type", "severity", "occurredAt", "confidence", "reasons",
            "evidence", "model", "idempotencyKey",
        }
        self.assertTrue(required.issubset(envelope.keys()))
        self.assertEqual(envelope["type"], "FALL_WITH_PROLONGED_INACTIVITY")
        self.assertEqual(envelope["severity"], "L3")
        self.assertIn("NO_RECOVERY_FOR_25_SECONDS", envelope["reasons"])
        self.assertTrue(
            str(envelope["idempotencyKey"]).startswith("edge_sim_01:camera_sim_01:")
        )


if __name__ == "__main__":
    unittest.main()
