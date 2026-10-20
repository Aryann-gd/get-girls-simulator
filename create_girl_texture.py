import os
from PIL import Image, ImageDraw

def create_girl_texture(output_path="e:/TycoonDev/girl_texture.png"):
    img = Image.new("RGBA", (512, 512), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Face Region (0, 0 to 256, 256)
    skin_color = (255, 230, 215, 255)
    draw.rectangle([0, 0, 256, 256], fill=skin_color)

    # Cute anime eyes with eyelashes
    # Left eye
    draw.arc([55, 80, 105, 115], start=180, end=360, fill=(30, 20, 25, 255), width=4) # Eyelash top
    draw.line([55, 90, 48, 85], fill=(30, 20, 25, 255), width=3) # Winged lash
    draw.ellipse([62, 95, 98, 138], fill=(255, 255, 255, 255))
    draw.ellipse([68, 100, 94, 135], fill=(50, 170, 230, 255)) # Aqua eyes
    draw.ellipse([74, 108, 88, 128], fill=(15, 45, 80, 255)) # Pupil
    draw.ellipse([72, 103, 80, 112], fill=(255, 255, 255, 255)) # Catchlight 1
    draw.ellipse([82, 122, 88, 128], fill=(255, 255, 255, 200)) # Catchlight 2

    # Right eye
    draw.arc([151, 80, 201, 115], start=180, end=360, fill=(30, 20, 25, 255), width=4) # Eyelash top
    draw.line([201, 90, 208, 85], fill=(30, 20, 25, 255), width=3) # Winged lash
    draw.ellipse([158, 95, 194, 138], fill=(255, 255, 255, 255))
    draw.ellipse([162, 100, 188, 135], fill=(50, 170, 230, 255)) # Aqua eyes
    draw.ellipse([168, 108, 182, 128], fill=(15, 45, 80, 255)) # Pupil
    draw.ellipse([166, 103, 174, 112], fill=(255, 255, 255, 255)) # Catchlight 1
    draw.ellipse([176, 122, 182, 128], fill=(255, 255, 255, 200)) # Catchlight 2

    # Slender delicate eyebrows
    draw.arc([60, 68, 100, 85], start=195, end=345, fill=(180, 120, 40, 255), width=3)
    draw.arc([156, 68, 196, 85], start=195, end=345, fill=(180, 120, 40, 255), width=3)

    # Rosy Cheeks
    draw.ellipse([48, 135, 82, 155], fill=(255, 160, 180, 180))
    draw.ellipse([174, 135, 208, 155], fill=(255, 160, 180, 180))

    # Cute nose dot
    draw.ellipse([126, 140, 130, 144], fill=(230, 175, 155, 255))

    # Sweet open smile
    draw.chord([110, 155, 146, 182], start=15, end=165, fill=(240, 90, 120, 255))
    draw.arc([108, 152, 148, 182], start=15, end=165, fill=(180, 50, 80, 255), width=3)
    draw.chord([116, 155, 140, 166], start=0, end=180, fill=(255, 255, 255, 255)) # White teeth bar

    img.save(output_path, "PNG")
    print("Girl texture generated at:", output_path)

if __name__ == "__main__":
    create_girl_texture()
