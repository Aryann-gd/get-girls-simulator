import bpy
import bmesh
import math
import os

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)
    for block in bpy.data.armatures:
        if block.users == 0:
            bpy.data.armatures.remove(block)
    for block in bpy.data.actions:
        if block.users == 0:
            bpy.data.actions.remove(block)

def create_player_material(texture_path):
    mat = bpy.data.materials.new(name="Player_Material")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    bsdf = nodes.get("Principled BSDF")
    if not bsdf:
        bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")

    tex_image = nodes.new(type="ShaderNodeTexImage")
    if os.path.exists(texture_path):
        img = bpy.data.images.load(texture_path)
    else:
        img = bpy.data.images.new("Player_Texture", width=512, height=512)
    tex_image.image = img
    tex_image.interpolation = 'Closest' # Crisp pixel look for stylized low-poly

    links.new(tex_image.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.5
    bsdf.inputs["Specular"].default_value = 0.2
    return mat

def create_color_material(name, rgba):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Roughness"].default_value = 0.4
    return mat

def assign_uvs(mesh, u_min, v_min, u_max, v_max):
    bm = bmesh.new()
    bm.from_mesh(mesh)
    uv_layer = bm.loops.layers.uv.verify()

    for face in bm.faces:
        # Simple bounding box mapping per face
        for i, loop in enumerate(face.loops):
            if i % 4 == 0:
                loop[uv_layer].uv = (u_min, v_min)
            elif i % 4 == 1:
                loop[uv_layer].uv = (u_max, v_min)
            elif i % 4 == 2:
                loop[uv_layer].uv = (u_max, v_max)
            else:
                loop[uv_layer].uv = (u_min, v_max)

    bm.to_mesh(mesh)
    bm.free()

def build_player_character(player_mat):
    parts = []

    # 1. HEAD (Center: 0, 0, 1.8)
    bpy.ops.mesh.primitive_cube_add(size=0.42, location=(0, 0, 1.82))
    head = bpy.context.active_object
    head.name = "Part_Head"
    head.scale = (1.0, 0.95, 1.05)
    bpy.ops.object.transform_apply(scale=True)
    
    # UV Map Head: Front face = Face Texture, Other faces = Hair / Skin
    bm = bmesh.new()
    bm.from_mesh(head.data)
    uv_layer = bm.loops.layers.uv.verify()
    for face in bm.faces:
        normal = face.normal
        if normal.y < -0.5: # Front face pointing -Y
            # Map to Face Texture region (u: 0.0 to 0.5, v: 0.5 to 1.0)
            # Find bounds in X and Z
            for loop in face.loops:
                v = loop.vert.co
                # Normalized mapping
                u = 0.25 + (v.x / 0.42) * 0.45
                v_coord = 0.75 + ((v.z - 1.82) / 0.42) * 0.45
                loop[uv_layer].uv = (u, v_coord)
        elif normal.z > 0.4 or normal.y > 0.4: # Top / Back of head = Hair
            for loop in face.loops:
                loop[uv_layer].uv = (0.75, 0.85)
        else: # Sides / Bottom = Hair / Skin
            for loop in face.loops:
                loop[uv_layer].uv = (0.75, 0.75)
    bm.to_mesh(head.data)
    bm.free()
    parts.append(head)

    # 2. HAIR STYLED QUIFF (Location: 0, -0.05, 2.05)
    bpy.ops.mesh.primitive_cube_add(size=0.44, location=(0, 0.03, 2.02))
    hair = bpy.context.active_object
    hair.name = "Part_Hair"
    hair.scale = (1.05, 1.08, 0.4)
    bpy.ops.object.transform_apply(scale=True)
    assign_uvs(hair.data, 0.55, 0.7, 0.95, 0.98) # Hair texture
    parts.append(hair)

    # 3. TORSO (Casual T-shirt, Center: 0, 0, 1.35)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.35))
    torso = bpy.context.active_object
    torso.name = "Part_Torso"
    torso.scale = (0.55, 0.32, 0.6)
    bpy.ops.object.transform_apply(scale=True)
    
    # UV Map Torso: Front face = Shirt logo & collar, others = pink shirt
    bm = bmesh.new()
    bm.from_mesh(torso.data)
    uv_layer = bm.loops.layers.uv.verify()
    for face in bm.faces:
        if face.normal.y < -0.5: # Front face
            for loop in face.loops:
                v = loop.vert.co
                u = 0.25 + (v.x / 0.55) * 0.45
                v_coord = 0.25 + ((v.z - 1.35) / 0.6) * 0.45
                loop[uv_layer].uv = (u, v_coord)
        else:
            for loop in face.loops:
                loop[uv_layer].uv = (0.1, 0.1) # Solid shirt fabric
    bm.to_mesh(torso.data)
    bm.free()
    parts.append(torso)

    # 4. ARMS (Left & Right, upper t-shirt sleeve, skin arm, hands)
    for side, x_sign, side_name in [(-1, -1, "R"), (1, 1, "L")]:
        # Upper Arm (T-shirt sleeve)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x_sign * 0.38, 0, 1.48))
        u_arm = bpy.context.active_object
        u_arm.name = f"Part_UpperArm_{side_name}"
        u_arm.scale = (0.18, 0.2, 0.32)
        bpy.ops.object.transform_apply(scale=True)
        assign_uvs(u_arm.data, 0.05, 0.05, 0.25, 0.25) # Shirt color
        parts.append(u_arm)

        # Forearm + Hand (Skin)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x_sign * 0.38, 0, 1.18))
        f_arm = bpy.context.active_object
        f_arm.name = f"Part_Forearm_{side_name}"
        f_arm.scale = (0.15, 0.17, 0.38)
        bpy.ops.object.transform_apply(scale=True)
        assign_uvs(f_arm.data, 0.6, 0.55, 0.85, 0.65) # Skin tone
        parts.append(f_arm)

    # 5. LEGS & JEANS (Left & Right)
    for x_sign, side_name in [(-1, "R"), (1, "L")]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x_sign * 0.18, 0, 0.6))
        leg = bpy.context.active_object
        leg.name = f"Part_Leg_{side_name}"
        leg.scale = (0.22, 0.24, 0.75)
        bpy.ops.object.transform_apply(scale=True)
        assign_uvs(leg.data, 0.55, 0.25, 0.95, 0.45) # Indigo jeans texture
        parts.append(leg)

        # SNEAKERS (Chunky Cyan Sneakers with White Sole)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x_sign * 0.18, -0.06, 0.1))
        shoe = bpy.context.active_object
        shoe.name = f"Part_Shoe_{side_name}"
        shoe.scale = (0.24, 0.36, 0.2)
        bpy.ops.object.transform_apply(scale=True)
        assign_uvs(shoe.data, 0.55, 0.02, 0.95, 0.2) # Sneakers with white sole
        parts.append(shoe)

    # Join all parts into single mesh
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = head
    bpy.ops.object.join()
    player_mesh = bpy.context.active_object
    player_mesh.name = "Player_Character"

    # Assign material
    player_mesh.data.materials.clear()
    player_mesh.data.materials.append(player_mat)

    # Smooth shading with auto-smooth
    bpy.ops.object.shade_smooth()
    player_mesh.data.use_auto_smooth = True
    player_mesh.data.auto_smooth_angle = math.radians(45)

    return player_mesh

def rig_and_animate_player(player_obj):
    # 1. Create Armature
    bpy.ops.object.armature_add(location=(0, 0, 0))
    armature_obj = bpy.context.active_object
    armature_obj.name = "Player_Armature"
    arm = armature_obj.data
    arm.name = "Player_Armature_Data"

    bpy.ops.object.mode_set(mode='EDIT')
    edit_bones = arm.edit_bones

    # Base bone is created by default as "Bone"
    root = edit_bones["Bone"]
    root.name = "Hips"
    root.head = (0, 0, 0.95)
    root.tail = (0, 0, 1.25)

    spine = edit_bones.new("Spine")
    spine.head = (0, 0, 1.25)
    spine.tail = (0, 0, 1.55)
    spine.parent = root

    neck = edit_bones.new("Neck")
    neck.head = (0, 0, 1.55)
    neck.tail = (0, 0, 1.7)
    neck.parent = spine

    head = edit_bones.new("Head")
    head.head = (0, 0, 1.7)
    head.tail = (0, 0, 2.1)
    head.parent = neck

    # Arms
    for side, x_sign in [("L", 1), ("R", -1)]:
        u_arm = edit_bones.new(f"UpperArm.{side}")
        u_arm.head = (x_sign * 0.35, 0, 1.5)
        u_arm.tail = (x_sign * 0.38, 0, 1.3)
        u_arm.parent = spine

        f_arm = edit_bones.new(f"Forearm.{side}")
        f_arm.head = (x_sign * 0.38, 0, 1.3)
        f_arm.tail = (x_sign * 0.38, 0, 0.98)
        f_arm.parent = u_arm

        # Legs
        u_leg = edit_bones.new(f"UpperLeg.{side}")
        u_leg.head = (x_sign * 0.18, 0, 0.95)
        u_leg.tail = (x_sign * 0.18, 0, 0.55)
        u_leg.parent = root

        l_leg = edit_bones.new(f"LowerLeg.{side}")
        l_leg.head = (x_sign * 0.18, 0, 0.55)
        l_leg.tail = (x_sign * 0.18, 0, 0.15)
        l_leg.parent = u_leg

        foot = edit_bones.new(f"Foot.{side}")
        foot.head = (x_sign * 0.18, 0, 0.15)
        foot.tail = (x_sign * 0.18, -0.18, 0.05)
        foot.parent = l_leg

    bpy.ops.object.mode_set(mode='OBJECT')

    # Parent mesh to Armature with automatic weights
    bpy.ops.object.select_all(action='DESELECT')
    player_obj.select_set(True)
    armature_obj.select_set(True)
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')

    # 2. Add Idle Breathing Animation
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 40
    bpy.context.scene.render.fps = 30

    armature_obj.animation_data_create()
    action = bpy.data.actions.new(name="Player_Idle_Action")
    armature_obj.animation_data.action = action

    bpy.ops.object.mode_set(mode='POSE')
    pose_bones = armature_obj.pose.bones

    # Idle animation: gentle breathing and slight arm movement
    # Frame 1: Base pose
    bpy.context.scene.frame_set(1)
    for b in pose_bones:
        b.keyframe_insert(data_path="location")
        b.keyframe_insert(data_path="rotation_quaternion")

    # Frame 20: Inhale / chest expansion
    bpy.context.scene.frame_set(20)
    pose_bones["Spine"].location = (0, 0, 0.025)
    pose_bones["Spine"].rotation_quaternion = (0.998, 0.05, 0, 0)
    pose_bones["Head"].rotation_quaternion = (0.998, -0.04, 0, 0)
    pose_bones["UpperArm.L"].rotation_quaternion = (0.996, 0, 0.07, 0)
    pose_bones["UpperArm.R"].rotation_quaternion = (0.996, 0, -0.07, 0)

    for b in pose_bones:
        b.keyframe_insert(data_path="location")
        b.keyframe_insert(data_path="rotation_quaternion")

    # Frame 40: Return to Base pose for seamless loop
    bpy.context.scene.frame_set(40)
    for b in pose_bones:
        b.location = (0, 0, 0)
        b.rotation_quaternion = (1, 0, 0, 0)
        b.keyframe_insert(data_path="location")
        b.keyframe_insert(data_path="rotation_quaternion")

    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.context.scene.frame_set(1)

    return armature_obj

def build_gym_bench():
    parts = []
    mat_metal = create_color_material("Mat_BenchMetal", (0.2, 0.22, 0.26, 1.0))
    mat_pad = create_color_material("Mat_BenchPad", (0.9, 0.2, 0.35, 1.0))
    mat_plate = create_color_material("Mat_BarbellPlates", (0.1, 0.5, 0.8, 1.0))

    # Cushion
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.8, 0, 0.45))
    bench = bpy.context.active_object
    bench.scale = (1.2, 0.45, 0.12)
    bpy.ops.object.transform_apply(scale=True)
    bench.data.materials.append(mat_pad)
    parts.append(bench)

    # Legs
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.8, 0, 0.2))
    legs = bpy.context.active_object
    legs.scale = (1.0, 0.35, 0.4)
    bpy.ops.object.transform_apply(scale=True)
    legs.data.materials.append(mat_metal)
    parts.append(legs)

    # Barbell
    bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=1.3, location=(1.8, 0, 0.85))
    barbell = bpy.context.active_object
    barbell.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    barbell.data.materials.append(mat_metal)
    parts.append(barbell)

    # Plates
    for y_sign in [-1, 1]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.22, depth=0.08, location=(1.8, y_sign * 0.55, 0.85))
        plate = bpy.context.active_object
        plate.rotation_euler = (math.radians(90), 0, 0)
        bpy.ops.object.transform_apply(rotation=True)
        plate.data.materials.append(mat_plate)
        parts.append(plate)

    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = bench
    bpy.ops.object.join()
    bench.name = "Gym_Bench"
    return bench

def build_clothing_rack():
    parts = []
    mat_wood = create_color_material("Mat_RackWood", (0.78, 0.58, 0.38, 1.0))
    mat_metal = create_color_material("Mat_RackMetal", (0.25, 0.28, 0.32, 1.0))
    mat_clothes1 = create_color_material("Mat_ClothCyan", (0.0, 0.85, 0.95, 1.0))
    mat_clothes2 = create_color_material("Mat_ClothYellow", (1.0, 0.85, 0.1, 1.0))
    mat_clothes3 = create_color_material("Mat_ClothPurple", (0.75, 0.25, 0.9, 1.0))

    # Base Bottom Planks
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-3.4, 0, 0.08))
    base = bpy.context.active_object
    base.scale = (1.4, 0.5, 0.12)
    bpy.ops.object.transform_apply(scale=True)
    base.data.materials.append(mat_wood)
    parts.append(base)

    # Left & Right Upright Metal Poles
    for x_offset in [-0.6, 0.6]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=1.5, location=(-3.4 + x_offset, 0, 0.85))
        pole = bpy.context.active_object
        pole.data.materials.append(mat_metal)
        parts.append(pole)

    # Top Hanging Crossbar
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=1.35, location=(-3.4, 0, 1.55))
    bar = bpy.context.active_object
    bar.rotation_euler = (0, math.radians(90), 0)
    bpy.ops.object.transform_apply(rotation=True)
    bar.data.materials.append(mat_metal)
    parts.append(bar)

    # Hanging Shirts on Hangers
    colors = [mat_clothes1, mat_clothes2, mat_clothes3]
    for i, x_offset in enumerate([-0.35, 0.0, 0.35]):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-3.4 + x_offset, 0, 1.05))
        shirt = bpy.context.active_object
        shirt.scale = (0.2, 0.32, 0.75)
        bpy.ops.object.transform_apply(scale=True)
        shirt.data.materials.append(colors[i % len(colors)])
        parts.append(shirt)

    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = base
    bpy.ops.object.join()
    base.name = "Clothing_Rack"
    return base

def build_girl_npc():
    parts = []
    # Girl Material with texture
    tex_path = "e:/TycoonDev/girl_texture.png"
    mat_girl = bpy.data.materials.new(name="Mat_Girl")
    mat_girl.use_nodes = True
    nodes = mat_girl.node_tree.nodes
    links = mat_girl.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    tex_img = nodes.new(type="ShaderNodeTexImage")
    if os.path.exists(tex_path):
        tex_img.image = bpy.data.images.load(tex_path)
    links.new(tex_img.outputs["Color"], bsdf.inputs["Base Color"])

    mat_hair = create_color_material("Mat_GirlHair", (0.95, 0.75, 0.25, 1.0))
    mat_top = create_color_material("Mat_GirlTop", (0.98, 0.3, 0.65, 1.0))
    mat_skirt = create_color_material("Mat_GirlSkirt", (0.2, 0.45, 0.95, 1.0))

    # Head (facing front -Y)
    bpy.ops.mesh.primitive_cube_add(size=0.4, location=(-1.6, 0, 1.78))
    head = bpy.context.active_object
    head.scale = (0.95, 0.95, 1.0)
    bpy.ops.object.transform_apply(scale=True)

    # UV Map Girl Head: Front face = Face Texture, Other = Hair/Skin
    bm = bmesh.new()
    bm.from_mesh(head.data)
    uv_layer = bm.loops.layers.uv.verify()
    for face in bm.faces:
        if face.normal.y < -0.5: # Front face pointing -Y
            for loop in face.loops:
                v = loop.vert.co
                u = 0.25 + ((v.x - (-1.6)) / 0.38) * 0.45
                v_coord = 0.75 + ((v.z - 1.78) / 0.4) * 0.45
                loop[uv_layer].uv = (u, v_coord)
        else:
            for loop in face.loops:
                loop[uv_layer].uv = (0.75, 0.75)
    bm.to_mesh(head.data)
    bm.free()
    head.data.materials.append(mat_girl)
    parts.append(head)

    # Hair / Ponytail
    bpy.ops.mesh.primitive_cube_add(size=0.42, location=(-1.6, 0.05, 1.95))
    hair = bpy.context.active_object
    hair.scale = (1.05, 1.1, 0.45)
    bpy.ops.object.transform_apply(scale=True)
    hair.data.materials.append(mat_hair)
    parts.append(hair)

    bpy.ops.mesh.primitive_cube_add(size=0.22, location=(-1.6, 0.28, 1.95))
    pony = bpy.context.active_object
    pony.data.materials.append(mat_hair)
    parts.append(pony)

    # Torso (Crop top)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.6, 0, 1.35))
    torso = bpy.context.active_object
    torso.scale = (0.44, 0.28, 0.45)
    bpy.ops.object.transform_apply(scale=True)
    torso.data.materials.append(mat_top)
    parts.append(torso)

    # Skirt
    bpy.ops.mesh.primitive_cone_add(radius1=0.36, radius2=0.22, depth=0.34, location=(-1.6, 0, 0.95))
    skirt = bpy.context.active_object
    skirt.data.materials.append(mat_skirt)
    parts.append(skirt)

    # Legs & Shoes
    mat_skin = create_color_material("Mat_GirlSkin", (1.0, 0.9, 0.8, 1.0))
    for x_sign in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.6 + x_sign * 0.12, 0, 0.45))
        leg = bpy.context.active_object
        leg.scale = (0.14, 0.18, 0.7)
        bpy.ops.object.transform_apply(scale=True)
        leg.data.materials.append(mat_skin)
        parts.append(leg)

        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.6 + x_sign * 0.12, -0.04, 0.08))
        shoe = bpy.context.active_object
        shoe.scale = (0.16, 0.26, 0.16)
        bpy.ops.object.transform_apply(scale=True)
        shoe.data.materials.append(mat_top)
        parts.append(shoe)

    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = head
    bpy.ops.object.join()
    head.name = "Girl_NPC_1"
    return head

def build_coin():
    mat_gold = create_color_material("Mat_CoinGold", (1.0, 0.82, 0.05, 1.0))
    mat_gold.node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value = 0.85
    mat_gold.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.2

    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.36, depth=0.08, location=(3.0, 0, 0.9))
    coin = bpy.context.active_object
    coin.name = "Coin"
    coin.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    coin.data.materials.append(mat_gold)
    return coin

def setup_camera_and_render(output_player_path, output_showcase_path):
    import mathutils

    # Clean existing cameras and lights
    for obj in list(bpy.context.scene.objects):
        if obj.type in ['CAMERA', 'LIGHT']:
            bpy.data.objects.remove(obj, do_unlink=True)

    # Lighting Setup (Studio 3-Point Light)
    sun_data = bpy.data.lights.new(name="Sun_Key", type='SUN')
    sun_data.energy = 3.5
    sun_data.color = (1.0, 0.98, 0.95)
    sun = bpy.data.objects.new(name="Sun_Key", object_data=sun_data)
    bpy.context.collection.objects.link(sun)
    sun.location = (2.5, -4.0, 4.5)
    sun.rotation_euler = (mathutils.Vector((0, 0, 1.0)) - sun.location).to_track_quat('-Z', 'Y').to_euler()

    fill_data = bpy.data.lights.new(name="Fill_Light", type='POINT')
    fill_data.energy = 160.0
    fill_data.color = (0.9, 0.8, 1.0)
    fill = bpy.data.objects.new(name="Fill_Light", object_data=fill_data)
    bpy.context.collection.objects.link(fill)
    fill.location = (-3.0, -3.0, 2.5)

    rim_data = bpy.data.lights.new(name="Rim_Light", type='POINT')
    rim_data.energy = 220.0
    rim_data.color = (0.0, 0.9, 1.0)
    rim = bpy.data.objects.new(name="Rim_Light", object_data=rim_data)
    bpy.context.collection.objects.link(rim)
    rim.location = (2.0, 2.5, 3.0)

    # World background
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.12, 0.1, 0.18, 1.0) # Deep plum/dark gradient studio
        bg.inputs["Strength"].default_value = 0.9

    bpy.context.scene.render.engine = 'BLENDER_EEVEE'

    # 1. Player Character Focused Render
    cam_data1 = bpy.data.cameras.new("Player_Camera")
    cam_data1.lens = 42
    cam1 = bpy.data.objects.new("Player_Camera", cam_data1)
    bpy.context.collection.objects.link(cam1)
    cam1.location = mathutils.Vector((0.0, -3.2, 1.25))
    target1 = mathutils.Vector((0.0, 0.0, 1.15))
    cam1.rotation_euler = (target1 - cam1.location).to_track_quat('-Z', 'Y').to_euler()

    bpy.context.scene.camera = cam1
    bpy.context.scene.render.resolution_x = 900
    bpy.context.scene.render.resolution_y = 900
    bpy.context.scene.render.filepath = output_player_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered Player portrait to: {output_player_path}")

    # 2. Wide Showcase Render (All 5 Assets)
    cam_data2 = bpy.data.cameras.new("Showcase_Camera")
    cam_data2.lens = 32
    cam2 = bpy.data.objects.new("Showcase_Camera", cam_data2)
    bpy.context.collection.objects.link(cam2)
    cam2.location = mathutils.Vector((0.0, -6.5, 2.2))
    target2 = mathutils.Vector((0.0, 0.0, 0.9))
    cam2.rotation_euler = (target2 - cam2.location).to_track_quat('-Z', 'Y').to_euler()

    bpy.context.scene.camera = cam2
    bpy.context.scene.render.resolution_x = 1200
    bpy.context.scene.render.resolution_y = 700
    bpy.context.scene.render.filepath = output_showcase_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered Full Showcase to: {output_showcase_path}")

def main():
    clear_scene()

    tex_path = "e:/TycoonDev/player_texture.png"
    player_mat = create_player_material(tex_path)

    # 1. Build Player with Face and Body Textures
    player = build_player_character(player_mat)

    # 2. Rig and Animate
    armature = rig_and_animate_player(player)

    # 3. Build other props from assetgeneration.md (spaced for showcase)
    build_gym_bench()
    build_clothing_rack()
    build_girl_npc()
    build_coin()

    # 4. Save .blend file
    blend_path = "e:/TycoonDev/gameassets.blend"
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"Saved live scene to: {blend_path}")

    # 5. Render Preview Images for Verification
    player_render = "e:/TycoonDev/player_preview.png"
    showcase_render = "e:/TycoonDev/assets_showcase.png"
    setup_camera_and_render(player_render, showcase_render)

    # Polycount checks
    print("--- POLYCOUNT AUDIT (Strict Limit < 1,500 tris) ---")
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            tri_count = sum(len(p.vertices) - 2 for p in obj.data.polygons)
            print(f"Object: {obj.name:25} | Triangles: {tri_count}")

main()
