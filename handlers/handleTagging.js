export async function handleTagging(imageData, env) {
    const modelId = '@cf/microsoft/resnet-50';  

    try {
        if (imageData instanceof File || imageData instanceof Blob) {
            const buffer = await imageData.arrayBuffer();
            const base64Image = `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;

            const response = await env.AI.run(modelId, {
                image: base64Image,  
                stream: false
            });

            if (!response || response.error) {
                throw new Error("Failed to generate tags from Workers AI");
            }

            const tags = response.labels ? response.labels.map(label => label.name) : [];
            return tags;
        } else {
            throw new Error("Provided image data is not a valid File or Blob");
        }
    } catch (error) {
        console.error("AI Tagging Error:", error);
        return [];
    }
}
