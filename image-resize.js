export function resizeImage(dataUrl, callback) {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 1024;
        let width = img.width;
        let height = img.height;
        if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = dataUrl;
}
