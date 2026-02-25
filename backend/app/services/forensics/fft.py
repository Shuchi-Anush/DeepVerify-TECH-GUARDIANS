import cv2
import numpy as np

def perform_fft(image_path, output_path="fft_output.jpg"):
    img = cv2.imread(image_path, 0)  # grayscale

    f = np.fft.fft2(img)
    fshift = np.fft.fftshift(f)
    magnitude = 20 * np.log(np.abs(fshift) + 1)

    # Normalize
    magnitude = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX)
    magnitude = np.uint8(magnitude)

    cv2.imwrite(output_path, magnitude)

    return output_path
