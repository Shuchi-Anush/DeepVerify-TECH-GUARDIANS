from PIL import Image, ImageChops, ImageEnhance
import os

def perform_ela(image_path, output_path="ela_output.jpg", quality=90):
    original = Image.open(image_path).convert("RGB")

    # Save compressed version
    temp_path = "temp_compressed.jpg"
    original.save(temp_path, "JPEG", quality=quality)

    compressed = Image.open(temp_path)

    # Compute difference
    diff = ImageChops.difference(original, compressed)

    # Enhance difference
    enhancer = ImageEnhance.Brightness(diff)
    ela_image = enhancer.enhance(10)

    ela_image.save(output_path)

    os.remove(temp_path)

    return output_path
