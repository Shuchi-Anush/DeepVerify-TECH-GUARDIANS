"""
Risk scoring module.

Aggregates individual forensic signal scores into a single normalised
manipulation-risk score and a human-readable label.
"""

# Weights for each forensic signal (must sum to 1.0)
SIGNAL_WEIGHTS: dict[str, float] = {
    "ela": 0.35,
    "fft": 0.30,
    "metadata": 0.35,
}

# Ordered thresholds → label
_THRESHOLDS: list[tuple[float, str]] = [
    (0.30, "REAL"),
    (0.60, "SUSPICIOUS"),
    (1.01, "TAMPERED"),  # 1.01 so that score == 1.0 maps to TAMPERED
]


def compute_risk_score(signals: dict) -> tuple[float, str]:
    """
    Compute a weighted risk score from forensic signal results.

    Args:
        signals: dict mapping signal name → dict containing at least a
                 ``"score"`` key (float 0-1).

    Returns:
        ``(risk_score, risk_label)`` where *risk_score* is in [0, 1] and
        *risk_label* is one of ``REAL``, ``SUSPICIOUS``, ``TAMPERED``,
        or ``INCONCLUSIVE`` (if no signals were available).
    """
    weighted_sum = 0.0
    weight_total = 0.0

    for name, weight in SIGNAL_WEIGHTS.items():
        signal = signals.get(name)
        if signal is None:
            continue
        score = signal.get("score", 0.0)
        weighted_sum += score * weight
        weight_total += weight

    # Normalise in case some signals were missing
    if weight_total > 0:
        risk_score = weighted_sum / weight_total
    else:
        return 0.0, "INCONCLUSIVE"

    risk_score = round(max(0.0, min(1.0, risk_score)), 4)

    # Determine label
    risk_label = "INCONCLUSIVE"
    for threshold, label in _THRESHOLDS:
        if risk_score < threshold:
            risk_label = label
            break

    return risk_score, risk_label
