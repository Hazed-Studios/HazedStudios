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

    const variables = {
      input: {
        recipientName: customerName,
        recipientMobile: phone,
        recipientAddress: address,
        // TODO: Map string governorate to correct Flottex Zone and Subzone IDs
        recipientZoneId: 1, 
        recipientSubzoneId: 1,
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
