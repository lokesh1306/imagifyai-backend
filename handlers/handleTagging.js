export async function handleTagging(imageData, env) {
    const modelId = '@cf/unum/uform-gen2-qwen-500m';

    try {
        const buffer = await imageData.arrayBuffer();
        const imageBlob = new Blob([buffer], { type: 'image/jpeg' });

        const response = await env.AI.run(modelId, {
            image: imageBlob, 
            stream: false
        });

        if (!response || response.error) {
            throw new Error("Failed to generate tags from Workers AI");
        }

        const tags = response.caption ? response.caption.split(' ') : [];
        return tags;
    } catch (error) {
        console.error("AI Tagging Error:", error);
        return [];
    }
}
