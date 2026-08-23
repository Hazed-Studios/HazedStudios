export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received Flottex API Request ---');
  const { customerName, phone, address, governorate, products, orderId, price, paymentMethod } = req.body;

  if (!customerName || !phone || !address || !governorate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // If the customer pays with InstaPay, the shipping company should collect 0 EGP (Prepaid)
  const isPrepaid = paymentMethod === 'InstaPay';
  const finalCodAmount = isPrepaid ? 0 : price;
  const flottexPaymentTypeCode = isPrepaid ? "CASH" : "COLC";

  try {
    // Check for flottex credentials in env
    if (!process.env.FLOTTEX_USERNAME || !process.env.FLOTTEX_PASSWORD) {
      console.error('Flottex API credentials missing from environment variables');
      return res.status(500).json({ error: 'Flottex API credentials missing from environment variables' });
    }

    const flottexApiUrl = 'https://flottex.lg.accuratess.com:8443/graphql';
    
    // 1. Authenticate with Flottex
    const loginQuery = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
        }
      }
    `;

    const loginVariables = {
      input: {
        username: process.env.FLOTTEX_USERNAME,
        password: process.env.FLOTTEX_PASSWORD
      }
    };

    const loginRes = await fetch(flottexApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: loginQuery, variables: loginVariables }),
    });

    const loginData = await loginRes.json();
    if (loginData.errors || !loginData.data?.login?.token) {
      console.error('Flottex authentication failed:', loginData.errors || loginData);
      return res.status(401).json({ error: 'Flottex authentication failed' });
    }

    const token = loginData.data.login.token;

    // 2. Create Shipment
    const createShipmentMutation = `
      mutation CreateShipment($input: ShipmentInput!) {
        saveShipment(input: $input) {
          id
          trackingUrl
        }
      }
    `;

    const zoneMap = {
      "Cairo": { zone: 1, subzone: 344 },
      "Giza": { zone: 2, subzone: 330 },
      "Alexandria": { zone: 3, subzone: 61 },
      "Qalyubia": { zone: 4, subzone: 107 },
      "Dakahlia": { zone: 7, subzone: 136 },
      "Damietta": { zone: 9, subzone: 162 },
      "Port Said": { zone: 10, subzone: 169 },
      "Ismailia": { zone: 11, subzone: 176 },
      "Suez": { zone: 12, subzone: 184 },
      "Sharqia": { zone: 14, subzone: 200 },
      "Kafr El Sheikh": { zone: 8, subzone: 153 },
      "Beheira": { zone: 15, subzone: 214 },
      "Matrouh": { zone: 16, subzone: 229 },
      "South Sinai": { zone: 29, subzone: 297 },
      "North Sinai": { zone: 1, subzone: 307 },
      "Faiyum": { zone: 17, subzone: 238 },
      "Minya": { zone: 19, subzone: 248 },
      "Asyut": { zone: 20, subzone: 255 },
      "Sohag": { zone: 21, subzone: 262 },
      "Qena": { zone: 22, subzone: 269 },
      "Luxor": { zone: 23, subzone: 276 },
      "Aswan": { zone: 24, subzone: 280 },
      "Red Sea": { zone: 26, subzone: 288 },
      "New Valley": { zone: 25, subzone: 285 },
      "Beni Suef": { zone: 18, subzone: 243 },
      "Monufia": { zone: 5, subzone: 119 },
      "Gharbia": { zone: 6, subzone: 128 }
    };
    
    const mappedZone = zoneMap[governorate] || { zone: 1, subzone: 344 };

    const variables = {
      input: {
        recipientName: customerName,
        recipientMobile: phone,
        recipientAddress: address,
        recipientZoneId: mappedZone.zone,
        recipientSubzoneId: mappedZone.subzone,
        description: products,
        price: finalCodAmount, // 0 if InstaPay, full price if COD
        refNumber: `ORDER-${orderId}`,
        serviceId: 1, // Default service ID (e.g. Next Day Delivery)
        weight: 1.0,
        piecesCount: 1,
        typeCode: "FDP",
        priceTypeCode: "INCLD",
        paymentTypeCode: flottexPaymentTypeCode,
        openableCode: "N"
      }
    };

    const shipmentRes = await fetch(flottexApiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        query: createShipmentMutation,
        variables 
      })
    });

    const shipmentData = await shipmentRes.json();

    if (shipmentData.errors) {
      console.error('Flottex create shipment error:', JSON.stringify(shipmentData.errors, null, 2));
      return res.status(500).json({ error: 'Failed to create Flottex shipment', details: shipmentData.errors });
    }

    return res.status(200).json({ success: true, shipment: shipmentData.data.saveShipment });

  } catch (err) {
    console.error('Flottex API error:', err);
    return res.status(500).json({ error: 'Internal server error while calling Flottex' });
  }
}
