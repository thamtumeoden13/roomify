import Replicate from "replicate";
import {NextResponse} from "next/server";
import {ROOMIFY_NEGATIVE_PROMPT, ROOMIFY_RENDER_PROMPT} from "@/lib/constants";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
    try {
        const {image, prompt} = await req.json();

        if (!image) {
            return NextResponse.json({error: "Image is required"}, {status: 400});
        }

        // Khởi tạo prediction
        const prediction = await replicate.predictions.create({
            // Sử dụng chính xác Version ID của lucataco/sdxl-controlnet
            version: "06d6fae3b75ab68a28cd2900afa6033166910dd09fd9751047043a5bbb4c184b",
            input: {
                image: image, // URL từ Vercel Blob
                prompt: prompt || ROOMIFY_RENDER_PROMPT,
                negative_prompt: ROOMIFY_NEGATIVE_PROMPT,
                condition_scale: 0.5,
                num_inference_steps: 50,
                guidance_scale: 7.5,
                scheduler: "K_EULER_ANCESTRAL", // Thêm scheduler phổ biến cho kiến trúc
                seed: Math.floor(Math.random() * 1000000), // Random seed để mỗi lần ra 1 kết quả khác nhau
            },
        });

        // Replicate trả về object prediction ngay lập tức
        if (prediction?.error) {
            console.error("Replicate internal error:", prediction.error);
            return NextResponse.json({error: prediction.error}, {status: 500});
        }

        return NextResponse.json(prediction, {status: 201});
    } catch (error: any) {
        console.error("Replicate error logic:", error);
        // Trả về lỗi chi tiết từ Replicate nếu có
        return NextResponse.json({error: error.message}, {status: 500});
    }
}