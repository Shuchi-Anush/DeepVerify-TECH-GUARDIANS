def compute_risk_score(metadata, ela_flag=True, fft_flag=True):
    score = 0

    if ela_flag:
        score += 0.4

    if fft_flag:
        score += 0.3

    if not metadata:
        score += 0.3

    if score >= 0.7:
        label = "TAMPERED"
    elif score >= 0.4:
        label = "SUSPICIOUS"
    else:
        label = "LOW RISK"

    return score, label
