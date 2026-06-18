import fetch from "node-fetch";

async function testEmail() {
  const options = {
    to: "roderbrasil@gmail.com",
    subject: "Teste de Email - Roder Indica V2",
    html: "<p>Este é um teste para verificar se o servidor de e-mail está funcionando.</p>"
  };

  try {
    const response = await fetch('http://localhost:3000/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    const result = await response.json();
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

testEmail();
