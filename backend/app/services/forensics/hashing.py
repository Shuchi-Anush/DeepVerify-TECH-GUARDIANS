import hashlib

def compute_sha256(image_path):
    sha256_hash = hashlib.sha256()

    with open(image_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)

    return sha256_hash.hexdigest()
