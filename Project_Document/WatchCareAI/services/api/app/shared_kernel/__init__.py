"""Shared kernel: vocabulary, domain events, and the in-process event bus.

This is the only package other modules may import freely. It must never
import from any business module.
"""
