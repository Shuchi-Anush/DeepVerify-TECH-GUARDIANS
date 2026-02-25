from PIL import Image
from PIL.ExifTags import TAGS

def extract_metadata(image_path):
    img = Image.open(image_path)
    exif_data = img._getexif()

    metadata = {}

    if exif_data:
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)
            metadata[tag] = value

    return metadata
