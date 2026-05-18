const phone = "917542011085";
const waPhoneId = "1003187042882454";
const waToken = "EAAUa9uBLlrkBQ60jMEqZCkjnZBMlYusWyLhleEn3TjZCo7QRUIFh96FDCDVXczooSZCRpb3Sd6sgz0cnlVzSEGZAcASnbGVFuB35bwwpKNJJwvoe0WGdRHwMNhCik5eqfcy84Wg1cRadVgJIFzFvu8yEBTmn7cMZAhpujveRpwLmI5Hpas6VKVUM0dDJYQloNjow8FsQq6oZBzBalF96mMnCRleUJe9B42KPSKK5HZBn0CuMeloZClanyUEsmtj4v98Qt52CZC59sL1EM6xrk4XZB6IMQX3iAIW";

async function send() {
    const fetch = globalThis.fetch;
    const response = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${waToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "template",
            template: {
                name: "hello_world",
                language: { code: "en_US" }
            }
        })
    });
    console.log("Status:", response.status);
    const body = await response.text();
    console.log("Body:", body);
}
send();
