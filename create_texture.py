import os
from PIL import Image, ImageDraw

def create_player_texture(output_path="e:/TycoonDev/player_texture.png"):
    img = Image.new("RGBA", (512, 512), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    # 1. FACE REGION (0, 0 to 256, 256)
    # Background skin tone
    skin_color = (255, 224, 189, 255)
    draw.rectangle([0, 0, 256, 256], fill=skin_color)

    # Eyes
    # Left eye (around x=75, y=110)
    draw.ellipse([60, 95, 95, 135], fill=(255, 255, 255, 255), outline=(30, 20, 20, 255), width=2)
    draw.ellipse([70, 102, 92, 132], fill=(40, 70, 140, 255)) # Iris
    draw.ellipse([76, 110, 88, 126], fill=(15, 15, 25, 255)) # Pupil
    draw.ellipse([73, 105, 80, 112], fill=(255, 255, 255, 255)) # Specular highlight

    # Right eye (around x=181, y=110)
    draw.ellipse([161, 95, 196, 135], fill=(255, 255, 255, 255), outline=(30, 20, 20, 255), width=2)
    draw.ellipse([164, 102, 186, 132], fill=(40, 70, 140, 255)) # Iris
    draw.ellipse([168, 110, 180, 126], fill=(15, 15, 25, 255)) # Pupil
    draw.ellipse([167, 105, 174, 112], fill=(255, 255, 255, 255)) # Specular highlight

    # Eyebrows
    draw.arc([55, 75, 100, 95], start=190, end=350, fill=(60, 35, 20, 255), width=4)
    draw.arc([156, 75, 201, 95], start=190, end=350, fill=(60, 35, 20, 255), width=4)

    # Cute nose hint
    draw.polygon([(128, 135), (124, 145), (132, 145)], fill=(235, 190, 160, 255))

    # Cheerful Smile
    draw.arc([100, 145, 156, 185], start=10, end=170, fill=(180, 50, 60, 255), width=4)
    # Smile tongue / mouth fill
    draw.chord([106, 155, 150, 182], start=15, end=165, fill=(230, 80, 95, 255))
    draw.chord([114, 155, 142, 168], start=0, end=180, fill=(255, 255, 255, 255)) # White teeth bar

    # Blushes
    draw.ellipse([50, 135, 80, 155], fill=(255, 180, 190, 160))
    draw.ellipse([176, 135, 206, 155], fill=(255, 180, 190, 160))

    # 2. HAIR REGION (256, 0 to 512, 160)
    hair_color = (65, 42, 28, 255)
    draw.rectangle([256, 0, 512, 160], fill=hair_color)
    # Hair strands/highlights
    for y in range(15, 150, 25):
        draw.line([265, y, 500, y + 5], fill=(95, 62, 45, 255), width=5)

    # SKIN GENERIC (Arms, Neck, Hands) (256, 160 to 512, 256)
    draw.rectangle([256, 160, 512, 256], fill=skin_color)

    # 3. T-SHIRT / BODY REGION (0, 256 to 256, 512)
    shirt_color = (255, 42, 133, 255) # Tycoon Hot Pink / Magenta
    draw.rectangle([0, 256, 256, 512], fill=shirt_color)
    # Collar / Neckline
    draw.arc([78, 240, 178, 290], start=10, end=170, fill=(255, 255, 255, 255), width=6)
    # Shirt graphic / Logo: Golden Tycoon Crown & Star
    crown_gold = (255, 200, 20, 255)
    draw.polygon([(100, 360), (110, 335), (128, 350), (146, 335), (156, 360)], fill=crown_gold)
    draw.rectangle([100, 360, 156, 370], fill=crown_gold)
    draw.ellipse([124, 385, 132, 393], fill=(255, 255, 255, 255))
    # Hem lines
    draw.line([10, 495, 246, 495], fill=(210, 25, 100, 255), width=4)

    # 4. PANTS / JEANS & SNEAKERS REGION (256, 256 to 512, 512)
    # Jeans (256, 256 to 512, 400)
    jeans_color = (35, 65, 115, 255) # Indigo denim
    draw.rectangle([256, 256, 512, 400], fill=jeans_color)
    # Jeans seam & pocket lines
    draw.line([270, 320, 360, 320], fill=(220, 160, 40, 255), width=3)
    draw.line([408, 320, 498, 320], fill=(220, 160, 40, 255), width=3)
    draw.line([384, 256, 384, 400], fill=(25, 48, 85, 255), width=4) # Center seam

    # Sneakers (256, 400 to 512, 512)
    sneaker_color = (15, 210, 230, 255) # Cyan upper
    draw.rectangle([256, 400, 512, 480], fill=sneaker_color)
    # White laces
    draw.line([300, 420, 340, 420], fill=(255, 255, 255, 255), width=3)
    draw.line([300, 435, 340, 435], fill=(255, 255, 255, 255), width=3)
    draw.line([428, 420, 468, 420], fill=(255, 255, 255, 255), width=3)
    draw.line([428, 435, 468, 435], fill=(255, 255, 255, 255), width=3)
    # Thick white soles
    draw.rectangle([256, 480, 512, 512], fill=(250, 250, 252, 255))
    draw.line([256, 480, 512, 480], fill=(200, 200, 205, 255), width=2)

    img.save(output_path, "PNG")
    print(f"Player texture successfully generated at: {output_path}")

if __name__ == "__main__":
    create_player_texture()
