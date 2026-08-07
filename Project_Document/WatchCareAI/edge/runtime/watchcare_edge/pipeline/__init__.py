"""AI analysis pipeline modules (design doc 4.1).

Data flow:
  CameraAdapter -> StreamSupervisor -> FrameSampler -> PersonDetector
  -> AnonymousTracker -> PoseEstimator -> TemporalAnalyzer
  -> ZoneEngine / FallCandidateEngine -> RiskVerifier
  -> EvidenceRecorder -> EventPublisher (+ LocalQueue offline outbox)
  ModelManager and HealthMonitor run alongside the pipeline.
"""
