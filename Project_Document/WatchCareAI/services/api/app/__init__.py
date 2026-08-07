"""WatchCare AI cloud modular monolith.

Modules must not touch each other's tables or internals (design doc 5.1);
cross-module collaboration goes through application services or the domain
event bus in app.shared_kernel.
"""
