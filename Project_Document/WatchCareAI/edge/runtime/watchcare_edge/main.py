"""Edge runtime entrypoint.

  python -m watchcare_edge.main --mode simulate [--api-url URL] [--count N]
  python -m watchcare_edge.main --mode pipeline    # real cameras (sprint 3)
"""
from __future__ import annotations

import argparse
import sys
import time
from typing import List, Optional

from watchcare_edge.pipeline.event_publisher import (
    HttpEventSink,
    StdoutEventSink,
)
from watchcare_edge.simulator.event_simulator import build_simulated_envelope


def run_simulator(args: argparse.Namespace) -> int:
    sink = HttpEventSink(args.api_url) if args.api_url else StdoutEventSink()
    for index in range(args.count):
        envelope = build_simulated_envelope(
            edge_id=args.edge_id,
            camera_id=args.camera_id,
            care_subject_id=args.care_subject_id,
        )
        result = sink.publish(envelope)
        if not result.ok:
            print(f"[warn] publish failed: {result.error}", file=sys.stderr)
        if index + 1 < args.count:
            time.sleep(args.interval)
    return 0


def run_pipeline(args: argparse.Namespace) -> int:
    print(
        "Pipeline mode wires CameraAdapter -> PersonDetector -> Tracker -> "
        "PoseEstimator -> TemporalAnalyzer -> ZoneEngine/FallCandidateEngine "
        "-> RiskVerifier -> EvidenceRecorder -> EventPublisher (LocalQueue).\n"
        "Camera adapters and AI models land in sprint 3; "
        "use --mode simulate for the vertical slice.",
        file=sys.stderr,
    )
    return 2


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(prog="watchcare-edge")
    parser.add_argument("--mode", choices=["simulate", "pipeline"],
                        default="simulate")
    parser.add_argument("--api-url", default=None,
                        help="cloud API base URL; omit to print envelopes to stdout")
    parser.add_argument("--count", type=int, default=1)
    parser.add_argument("--interval", type=float, default=2.0)
    parser.add_argument("--edge-id", default="edge_sim_01")
    parser.add_argument("--camera-id", default="camera_sim_01")
    parser.add_argument("--care-subject-id", default="subject_sim_01")
    args = parser.parse_args(argv)
    if args.mode == "simulate":
        return run_simulator(args)
    return run_pipeline(args)


if __name__ == "__main__":
    raise SystemExit(main())
