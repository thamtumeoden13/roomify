// Timing Constants (in milliseconds)
export const SHARE_STATUS_RESET_DELAY_MS = 1500;
export const PROGRESS_INCREMENT = 15;
export const REDIRECT_DELAY_MS = 600;
export const PROGRESS_INTERVAL_MS = 100;
export const PROGRESS_STEP = 5;

// UI Constants
export const GRID_OVERLAY_SIZE = "60px 60px";
export const GRID_COLOR = "#3B82F6";

// HTTP Status Codes
export const UNAUTHORIZED_STATUSES = [401, 403];

// Image Dimensions
export const IMAGE_RENDER_DIMENSION = 1024;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

// export const ROOMIFY_RENDER_PROMPT = `
// Professional architectural 3D plan visualization, bird's-eye view, top-down orthographic render.
// The output must be a clean, photorealistic 3D floor plan based exactly on the provided 2D layout.
//
// GEOMETRY & STRUCTURE:
// - Precisely extrude walls from the 2D plan lines with consistent height.
// - Realistic glass material for windows and clear openings for doors.
// - Perfectly aligned architectural elements, matching every dimension of the input floor plan.
//
// INTERIOR MAPPING & MATERIALS:
// - Floor: High-quality hardwood, polished marble, and ceramic tile textures.
// - Furniture: Replace 2D icons with realistic 3D assets: soft fabric sofas, wooden dining sets, modern kitchen cabinetry, sleek bathroom fixtures, and cozy beds with realistic linens.
// - Surfaces: Clean, matte-finished walls with subtle ambient occlusion shadows in corners.
//
// STYLE & LIGHTING:
// - Lighting: Bright, diffused natural daylight, soft shadows, high-end Octane render style, Unreal Engine 5 aesthetic.
// - Clarity: Sharp edges, 8k resolution, cinematic architectural photography, masterpiece, ultra-detailed.
//
// ENVIRONMENT:
// - Clean continuous surfaces, clutter-free, professional real estate presentation.
// `.trim();
export const ROOMIFY_RENDER_PROMPT = `
Professional architectural visualization diorama. 
3D EXTRUSION: Every wall must be a THICK, SOLID, MONOLITHIC architectural structure with precise 90-degree corners and significant depth. Walls should look like heavy physical slabs extruded upwards from the floor plan.
SURFACE CLEANUP: Aggressively overpaint and completely hide all 2D text, dimensions, labels, and original floor plan lines. Replace them with high-fidelity 3D surfaces and materials. Zero 2D artifacts.
LIGHTING & RENDERING: Physically Based Rendering (PBR), Global Illumination, Ray-traced reflections, Unreal Engine 5.4 Lumen render. Cinematic lighting with soft ambient occlusion and sharp architectural focus.
QUALITY: 8k UHD, masterpiece, photorealistic textures, hyper-realistic materials, high-end ArchViz photography style.
`.trim();

export const ROOMIFY_NEGATIVE_PROMPT = `
text, words, letters, digits, numbers, labels, dimensions, 3d text, 3d letters, signage, typography, watermark, logo, annotations, measurements, 
warped walls, floating furniture, ghosting text, overlapping rooms, distorted perspectives, "alphabet-shaped" furniture, 
blurry, low quality, distorted, section view, side view, perspective distortion, messy floor, floor markings, architectural symbols, 
3D typography, word-shaped objects, floor decals, floor stickers, carpet patterns, rugs with text, messy grass, 
drawing, distorted, perspective tilt, hand-drawn, paper texture, blueprints, black and white lines on floor, cluttered surfaces.
`.trim();

// 2. PHONG CÁCH NỘI THẤT (Định nghĩa vật liệu và đồ đạc)
export const ROOM_STYLES = [
    {
        id: "modern",
        name: "Modern",
        keywords: "ultra-modern minimalist luxury, phong cách hiện đại, sleek architectural lines, bespoke contemporary furniture, neutral high-end color palette, expansive bright open space, flat uniform surfaces, absolute structural clarity, high-end Italian furniture design, clean geometric forms."
    },
    {
        id: "neoclassic",
        name: "Neoclassic",
        keywords: "elegant neoclassical architecture, tân cổ điển, ornate plaster ceiling moldings, symmetrical facades, cream and ivory color palette, decorative columns and pilasters, intricate iron balustrades, marble flooring with classical veining, gold accent fixtures, grand proportions, European classical sophistication."
    },
    {
        id: "indochine",
        name: "Indochine",
        keywords: "French Indochine colonial architecture, phong cách Đông Dương, warm timber louver shutters, terracotta and ochre tones, arched windows and verandas, rattan and dark tropical hardwood furniture, Vietnamese mosaic tile floors, lush courtyard tropical greenery, ceiling fans, antique brass hardware, fusion of Asian and European colonial elegance."
    },
    {
        id: "japandi",
        name: "Japandi",
        keywords: "premium japandi aesthetic, fusion of Japanese zen and Scandinavian functionality, organic natural white oak and cedar solids, wabi-sabi textures, serene calm atmosphere, clean soft lines, clutter-free spatial volume, tatami and shoji screen influences, neutral stone and sand palette, artisanal handmade ceramics."
    },
    {
        id: "scandinavian",
        name: "Scandinavian",
        keywords: "phong cách Scandinavian, Nordic minimalist design, light birch wood furniture, hygge atmosphere, white and light gray palette, natural linen and wool textiles, abundant natural daylight, simple functional forms, pine and spruce wood accents, cozy layered rugs, Scandi flat-pack aesthetic elevated to luxury."
    },
    {
        id: "industrial",
        name: "Industrial",
        keywords: "luxury industrial 3D loft, phong cách công nghiệp, volumetric weathered brick walls, refined black powder-coated metal structural accents, polished monolithic concrete, factory-style steel windows, raw professional aesthetic, high-contrast material depth, exposed structural beams, Edison bulb lighting, reclaimed wood surfaces."
    },
    {
        id: "wabi-sabi",
        name: "Wabi-Sabi",
        keywords: "Japanese wabi-sabi philosophy, imperfect beauty aesthetic, rough handmade plaster walls, unfinished raw textures, aged linen and cotton, asymmetric organic forms, weathered wood with visible grain, handcrafted pottery and ceramics, muted earthy tones — ash, clay, stone, moss, intentional imperfection elevated to art."
    },
    {
        id: "tropical-modern",
        name: "Tropical Modern",
        keywords: "contemporary tropical architecture, indoor-outdoor living, floor-to-ceiling sliding glass walls, natural teak and bamboo elements, lush interior tropical planting, exposed concrete and rattan combination, cross-ventilation architecture, resort-grade outdoor furniture, stone water features, Vietnamese tropical garden context, humid climate materials."
    }
];

// 3. VẬT LIỆU SÀN (Định nghĩa độ đặc và phản chiếu)
export const FLOORING_MATERIALS = [
    {
        id: "light-oak",
        name: "Light Oak",
        keywords: "solid opaque light oak timber planks, micro-texture detail, specular highlights, continuous natural wood grain, high-quality scandinavian hardwood, seamless tiling, soft satin finish."
    },
    {
        id: "dark-walnut",
        name: "Dark Walnut",
        keywords: "premium opaque dark walnut hardwood, rich deep wood grain textures, specular highlights, polished heavy timber slabs, luxury seamless architectural tiling, sophisticated dark wood aesthetic."
    },
    {
        id: "polished-concrete",
        name: "Polished Concrete",
        keywords: "industrial solid polished gray concrete slab, seamless monolithic cement texture, specular reflections, architectural monolithic flooring, matte finish with realistic micro-textures."
    },
    {
        id: "white-marble",
        name: "White Marble",
        keywords: "luxury opaque white carrara marble, elegant gray veining, high-gloss solid stone surface, specular reflections, premium seamless marble tiling, reflective palace-grade finish."
    },
    {
        id: "hexagon-tiles",
        name: "Hexagon Tiles",
        keywords: "modern solid ceramic hexagon tiles, geometric 3D floor layout, opaque tile textures, clean architectural grouting, stylish designer flooring with depth, seamless tiling patterns."
    }
];

// 4. ÁNH SÁNG (Định nghĩa bóng đổ và hiệu ứng không gian)
export const LIGHTING_MOODS = [
    {
        id: "natural-daylight",
        name: "Natural Daylight",
        keywords: "ánh sáng ban ngày tự nhiên, trời trong xanh — fresh bright natural sunlight, clear blue sky, realistic daylight through large windows, balanced soft shadows, airy vibrant atmosphere, volumetric God rays from windows.",
        description: "Bright and clear daylight, clear blue sky"
    },
    {
        id: "golden-hour",
        name: "Golden Hour",
        keywords: "ánh sáng hoàng hôn ấm áp, đổ bóng dài — cinematic warm golden hour orange glow, dramatic 45-degree long shadows cast by low sun, volumetric sunrays, peaceful luxury mood, high-contrast sunset atmosphere.",
        description: "Warm cinematic glow, long dramatic shadows"
    },
    {
        id: "purple-dusk",
        name: "Purple Dusk",
        keywords: "buổi hoàng hôn tím with ánh sáng đèn nội thất hắt ra lung linh — deep purple twilight sky, warm amber interior lights glowing through windows, blue-violet exterior ambience, magical dusk atmosphere, city lights beginning to twinkle.",
        description: "Purple twilight with glowing interior warmth"
    },
    {
        id: "night-moonlight",
        name: "Night Moonlight",
        keywords: "ánh sáng ban đêm, ánh trăng chiếu sáng toàn cảnh — dramatic nighttime moonlight illumination, cool blue moonlight shadows, glowing interior and exterior lighting fixtures, nocturnal architectural photography, cinematic low-key night scene.",
        description: "Dramatic moonlight with glowing lights"
    },
    {
        id: "cozy-evening",
        name: "Cozy Evening",
        keywords: "intimate cozy evening artificial lighting, warm indoor designer lamps at golden hour, soft recessed ceiling glow, moody interior atmosphere, warm amber and terracotta hues, realistic domestic tranquility, candlelight warmth.",
        description: "Intimate atmosphere with warm indoor lights"
    },
    {
        id: "morning-mist",
        name: "Morning Mist",
        keywords: "sương mù dày đặc vào sáng sớm tạo cảm giác huyền ảo — thick atmospheric morning mist, soft diffused foggy light, hazy dreamy atmosphere, cool blue-gray tones, ethereal misty landscape, early morning tranquility, mist rising from ground.",
        description: "Mystical early morning mist and fog"
    },
    {
        id: "after-rain",
        name: "After Rain",
        keywords: "trời vừa mưa xong đường hơi ướt, bầu trời mây nhẹ — wet reflective surfaces after rain, glistening pavement reflections, soft overcast post-rain sky, fresh clean atmosphere, puddle reflections, slightly humid air, dramatic light breaking through clearing clouds.",
        description: "Reflective wet surfaces after rainfall"
    },
    {
        id: "overcast",
        name: "Overcast",
        keywords: "trời u ám, ánh sáng dịu, không có bóng gắt — overcast cloudy sky, soft diffused shadowless light, even neutral illumination, flat professional photography lighting, no harsh shadows, material colors rendered accurately, studio-quality natural light.",
        description: "Soft even light, no harsh shadows"
    },
    {
        id: "studio-white",
        name: "Studio White",
        keywords: "professional neutral white studio lighting, clinical high-key clarity, architectural photography lighting, clean perfectly balanced shadows, focus on material details and sharp edges, catalog-quality illumination.",
        description: "Neutral balanced professional studio lighting"
    }
];

// 5. NGỮ CẢNH DỰ ÁN (Định nghĩa bối cảnh tổng thể)
export const PROJECT_CONTEXTS = [
    {
        id: "residential",
        name: "Residential",
        icon: "Home",
        keywords: "high-end residential home, cozy domestic living environment, realistic home architectural visualization, premium urban lifestyle, family-scale architecture."
    },
    {
        id: "luxury-real-estate",
        name: "Luxury Villa",
        icon: "Castle",
        keywords: "exquisite luxury villa, mansion-grade finishes, high ceilings, expansive premium spaces, swimming pool and landscaped garden, sophisticated elite architectural visualization."
    },
    {
        id: "vinhomes-urban",
        name: "Vinhomes Urban",
        icon: "Building",
        keywords: "ở khu đô thị sang trọng, hiện đại Vinhomes Hà Nội — luxury gated urban community, contemporary high-rise apartment complex, premium Vietnamese urban development, manicured communal gardens, modern Vietnamese metropolitan context."
    },
    {
        id: "vietnamese-street",
        name: "Vietnamese Street",
        icon: "Globe",
        keywords: "ở đường phố Việt Nam — authentic Vietnamese street context, neighboring shophouses, tropical street trees, motorbikes and urban texture, genuine Hanoi or Ho Chi Minh City urban fabric, narrow street proportions, local architectural vernacular."
    },
    {
        id: "tropical-garden",
        name: "Tropical Garden",
        icon: "Leaf",
        keywords: "sân vườn nhiệt đới tại miền quê Việt Nam — lush tropical Vietnamese garden setting, mature banyan and palm trees, bamboo groves, koi pond, stone pathways, humid tropical greenery, outdoor pavilion, Vietnamese countryside ambiance."
    },
    {
        id: "mountain-foothills",
        name: "Mountain Retreat",
        icon: "Mountain",
        keywords: "nằm dưới chân núi hùng vĩ — dramatic mountain foothills setting, majestic mountain backdrop, surrounding alpine forest, pool terrace with mountain views, autumn-colored foliage, pristine lawn, tranquil highland retreat atmosphere."
    },
    {
        id: "commercial-office",
        name: "Office Space",
        icon: "Building",
        keywords: "modern corporate workplace, professional business environment, high-tech office architecture, sleek productive atmosphere, commercial-grade lighting, open-plan collaborative spaces."
    },
    {
        id: "retail-hospitality",
        name: "Cafe & Retail",
        icon: "Store",
        keywords: "boutique Vietnamese cafe or retail space, hospitality architecture, stylish commercial public space, designer shop aesthetic, high-end cafe with tropical plants, open-air terrace, artisanal F&B visualization."
    }
];

// 6. GÓC NHÌN CAMERA
export const CAMERA_VIEWS = [
    {
        id: "plan",
        name: "Top-Down",
        description: "90° overhead orthographic plan view",
        keywords: "strict 90-degree overhead top-down shot, orthographic camera projection, perfect vertical axis, no camera tilt, flat plan view."
    },
    {
        id: "isometric",
        name: "Isometric",
        description: "Classic 45° diorama angle",
        keywords: "45-degree angled camera tilt-shift, physical 3D diorama aesthetic, visible wall thickness and spatial volume."
    },
    {
        id: "birds-eye",
        name: "Bird's Eye",
        description: "High aerial view, ~60° elevation",
        keywords: "dramatic high-angle bird's eye view, 60-degree elevated aerial perspective, sweeping spatial overview, dynamic architectural photography from above."
    },
    {
        id: "3-4-angle",
        name: "3/4 View",
        description: "Balanced 3/4 perspective angle",
        keywords: "elegant three-quarter perspective angle, 30-degree comfortable tilt, balanced spatial depth and width, architectural interior photography, moderate tilt-shift effect."
    },
    {
        id: "eye-level",
        name: "Eye Level",
        description: "Human walkthrough perspective",
        keywords: "realistic human eye-level perspective, first-person interior walkthrough view, natural horizon line at 5 feet height, immersive architectural photography, ground-level interior scene."
    },
    {
        id: "wide-shot",
        name: "Wide Angle",
        description: "Ultra-wide panoramic overview",
        keywords: "ultra-wide angle architectural panoramic shot, expansive spatial composition, cinematic wide lens, dramatic spatial depth, comprehensive full-room overview."
    },
    {
        id: "close-up",
        name: "Detail Shot",
        description: "Material and texture close-up",
        keywords: "macro architectural close-up shot, extreme material texture detail, tight compositional focus, high-resolution surface and material photography, PBR material showcase, detail-oriented architectural photography."
    },
    {
        id: "street-level",
        name: "Street Level",
        description: "Low dramatic upward angle",
        keywords: "low street-level camera angle, upward architectural perspective, dramatic bottom-up composition, dynamic imposing viewpoint, low camera height, grandiose spatial drama."
    }
];

// 7. PROMPT PRESETS (adapted from aicomplex.vn patterns)
export const PROMPT_PRESETS = [
    {
        category: "Lighting",
        items: [
            "Natural daylight, clear blue sky",
            "Warm golden hour lighting, long dramatic shadows",
            "Night time with moonlight and glowing interior lights",
            "Overcast sky, soft shadowless light",
            "Dawn with crisp morning mist and peaceful air",
            "Purple twilight dusk with glowing warm windows",
            "After rain, wet reflective roads and clearing clouds",
            "Heavy atmospheric morning fog, ethereal and mysterious",
        ]
    },
    {
        category: "Scene Context",
        items: [
            "On a Vietnamese urban street with neighboring houses",
            "In a luxury Vinhomes gated community, Hanoi",
            "In a tropical Vietnamese garden with bamboo and koi pond",
            "At the foot of majestic mountains with autumn foliage",
            "In a large European garden with stone paths and sculptures",
            "Next to an asphalt road with green trees on both sides",
            "Luxury urban high-rise penthouse setting, city views",
            "Serene Japanese zen garden, minimalist rock landscape",
        ]
    },
    {
        category: "Camera Angle",
        items: [
            "High-angle shot from above",
            "Low-angle shot looking up, imposing grand scale",
            "3/4 view from the left, showing depth",
            "3/4 view from the right, showing depth",
            "Straight-on symmetrical front facade shot",
            "Detailed close-up shot focusing on materials and textures",
        ]
    },
    {
        category: "Material Focus",
        items: [
            "Emphasize rich material textures and tactile depth",
            "Highlight clean structural architectural lines and geometry",
            "Showcase premium furniture scale and spatial arrangement",
            "Feature bespoke decorative details and accent elements",
        ]
    },
];

// 8. INTERIOR VIEWS — 4 góc nhìn từ ảnh 3D top-view
export const INTERIOR_VIEWS = [
    {
        id: "interior-entrance",
        name: "Entrance View",
        nameVi: "Góc cửa chính",
        emoji: "🚪",
        description: "Nhìn từ cửa chính vào trong",
        keywords: `You are a professional architectural interior photographer.
            From this top-down 3D floor plan, generate a photorealistic INTERIOR perspective view standing at the main entrance door, looking INTO the space.
            Camera position: at the main entrance/front door threshold, eye-level (1.6m height), facing inward.
            Composition: show the full depth of the room — from entrance toward the back wall.
            Include ceiling, flooring, all visible walls, furniture in their correct positions from this angle.
            Apply existing style, materials, flooring, and lighting exactly as defined in the floor plan.
            Cinematic wide-angle lens (24mm equivalent), natural depth of field.
            High-end architectural interior photography, photorealistic render quality.`.trim().replace(/\s+/g, ' ')
    },
    {
        id: "interior-garden",
        name: "Inside-Out View",
        nameVi: "Góc nhìn ra vườn",
        emoji: "🌿",
        description: "Từ trong nhìn ra vườn / cửa sổ",
        keywords: `You are a professional architectural interior photographer.
            From this top-down 3D floor plan, generate a photorealistic INTERIOR perspective view standing inside the room, looking OUTWARD toward the largest window, glass door, or garden-facing wall.
            Camera position: center of the main living area, eye-level (1.6m), facing the exterior opening.
            Composition: foreground shows interior furniture; midground shows the window/glass door frame; background reveals the exterior garden, terrace, or outdoor space.
            Natural light floods in from the exterior opening, creating beautiful backlit atmosphere.
            Apply existing style, materials, flooring, and lighting exactly as defined in the floor plan.
            Cinematic depth of field — sharp interior, softly blurred exterior lush garden.
            High-end architectural interior photography, photorealistic render quality.`.trim().replace(/\s+/g, ' ')
    },
    {
        id: "interior-corner",
        name: "Corner Wide Shot",
        nameVi: "Góc phòng / Toàn cảnh",
        emoji: "📐",
        description: "Góc phòng, thấy toàn bộ không gian",
        keywords: `You are a professional architectural interior photographer.
            From this top-down 3D floor plan, generate a photorealistic INTERIOR perspective view from a corner of the room, looking diagonally across to capture the maximum spatial width.
            Camera position: one of the back corners of the room, eye-level (1.6m), pointing diagonally toward the opposite front corner.
            Composition: ultra-wide shot showing TWO full walls converging to a corner, complete flooring, full ceiling — capturing the entire room in one dramatic frame.
            All furniture, fixtures, and architectural details clearly visible.
            Apply existing style, materials, flooring, and lighting exactly as defined in the floor plan.
            Ultra-wide angle lens (16mm equivalent), minimal distortion, exaggerated spatial depth.
            Award-winning architectural interior photography, magazine-quality photorealistic render.`.trim().replace(/\s+/g, ' ')
    },
    {
        id: "interior-feature",
        name: "Feature Close-Up",
        nameVi: "Điểm nhấn / Cận cảnh",
        emoji: "✨",
        description: "Cận cảnh vật liệu và điểm nhấn",
        keywords: `You are a professional architectural interior photographer specializing in detail and feature shots.
            From this top-down 3D floor plan, generate a photorealistic CLOSE-UP detail shot focusing on the most visually striking element of the space.
            Choose the most photogenic feature: a statement wall with texture, the primary furniture grouping, a fireplace, kitchen island, decorative lighting fixture, or a material showcase area.
            Camera position: close to the subject (0.8–1.5m distance), slightly elevated (1.2m height), angled to maximize visual impact.
            Composition: tight, editorial framing — the hero element fills 60–70% of frame, with secondary elements softly blurred in background (bokeh effect).
            Apply existing style, materials, flooring, and lighting exactly as defined in the floor plan.
            50mm portrait-style lens, shallow depth of field, cinematic lighting.
            High-end interior design magazine photography, photorealistic luxury render.`.trim().replace(/\s+/g, ' ')
    },
];

export const ROOMIFY_INPAINT_PROMPT = `
seamlessly blend the new texture with the surrounding 3D environment, match lighting and shadows, high-fidelity integration, ArchViz standard, physically based rendering.
`.trim();

// 8. CONSTRUCTION STAGES — 5 giai đoạn thi công (prompts from aicomplex.vn methodology)
export const CONSTRUCTION_STAGES = [
    {
        id: "construction-1",
        name: "Messy Site",
        nameVi: "Công trình ngổn ngang",
        emoji: "🏗️",
        description: "Raw excavation, debris, materials scattered",
        keywords: `Replace the current image with a messy active construction site.
            The ground is covered with loose dirt, stones, sand, and construction debris.
            Scattered building materials: stacked bricks, rebar bundles, cement bags, timber planks.
            Construction machinery visible — excavator or concrete mixer in background.
            Rough foundation trenches dug, exposed soil and muddy puddles.
            Scaffolding poles and safety netting partially erected.
            Overcast working-day lighting, photorealistic construction documentary photography.
            NO finished architecture — everything is raw and under construction.`.trim().replace(/\s+/g, ' ')
    },
    {
        id: "construction-2",
        name: "Cleared & Leveled",
        nameVi: "Mặt bằng sạch",
        emoji: "🟫",
        description: "Site cleared, temporary fencing erected",
        keywords: `Replace with a leveled and cleaned construction ground plot.
            Flat compacted soil or gravel ground, site thoroughly cleared of debris.
            Temporary construction site fence erected around perimeter — blue or green corrugated metal fence panels with construction signage.
            Foundation slab or footings poured and set, concrete visible at ground level.
            Survey stakes and string lines marking building layout on ground.
            Clean organized site ready for structural work to begin.
            Bright natural daylight, clear professional site photography.`.trim().replace(/\s+/g, ' ')
    },
    {
        id: "construction-3",
        name: "Structure Erected",
        nameVi: "Xây dựng thô",
        emoji: "🧱",
        description: "Unplastered brick walls, exposed concrete structure",
        keywords: `Replace with rough structural construction phase complete.
            Unplastered red brick walls with visible mortar joints, raw and textured.
            Exposed grey concrete columns and beams forming the structural frame.
            No plaster, no paint, no glass windows — only raw openings.
            No railings, no flooring finish — bare concrete slab.
            Scaffolding still partially visible alongside the structure.
            Structural steel reinforcement bars visible where concrete is not yet poured.
            Construction workers optional in background for scale.
            Overcast or partial sun, realistic construction site documentary photography.`.trim().replace(/\s+/g, ' ')
    },
    {
        id: "construction-4",
        name: "Finishing Phase",
        nameVi: "Hoàn thiện",
        emoji: "🎨",
        description: "Plastered walls, windows installed, yard empty",
        keywords: `Replace with interior/exterior finishing phase, near completion.
            Walls fully plastered and painted according to design color scheme.
            Windows and door frames fully installed with glass panes.
            Flooring tiles or hardwood being laid or recently completed.
            Light fixtures installed, electrical switch plates and socket covers in place.
            Yard or garden area cleared and leveled but not yet landscaped — bare earth or gravel.
            No decorative gates, no plants, no outdoor furniture yet.
            Clean professional walkthrough photography, natural bright daylight.
            Scaffolding removed, building approaching handover condition.`.trim().replace(/\s+/g, ' ')
    },
    {
        id: "construction-5",
        name: "Completed",
        nameVi: "Hoàn chỉnh",
        emoji: "✨",
        description: "Full landscaping, furniture, photorealistic final",
        keywords: `Replace with the fully completed and landscaped final project.
            Beautiful stone or tile pathways leading to main entrance.
            Lush green lawn, trimmed hedges, flowering plants and mature shade trees.
            Garden lighting — lanterns, uplights, path lights glowing warmly.
            Elegant decorative gate and perimeter fence, fully finished.
            Outdoor furniture, water features or swimming pool if appropriate.
            Interior fully furnished and decorated, visible through glass windows.
            Golden hour or natural daylight, award-winning architectural photography.
            Photorealistic, magazine-quality render, showroom-perfect condition.`.trim().replace(/\s+/g, ' ')
    },
];

