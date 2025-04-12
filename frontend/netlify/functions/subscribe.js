// CommonJS syntax for Netlify Functions compatibility
const fetch = require('node-fetch');

// Use CommonJS exports
exports.handler = async (event) => {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*', // Or restrict to your domain
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { email } = JSON.parse(event.body);
    
    if (!email) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ success: false, error: 'Email is required' }) 
      };
    }

    // Your ConvertKit form ID
    const formId = '7903890';
    const apiKey = process.env.CONVERTKIT_API_KEY;
    
    // Make sure we have the API key
    if (!apiKey) {
      console.error('Missing CONVERTKIT_API_KEY environment variable');
      return { 
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Server configuration error: Missing API key' 
        }) 
      };
    }
    
    console.log(`Attempting to subscribe email ${email} to form ${formId}`);
    
    // Submit to ConvertKit API
    try {
      const response = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          email
        }),
      });

      // Log full response for debugging
      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response:', JSON.stringify(data));
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        console.log('Response was not valid JSON:', responseText);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            success: false, 
            error: 'Error parsing API response',
            details: responseText
          })
        };
      }

      if (response.ok) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true,
            message: 'Subscription successful',
            subscriber: data.subscription ? data.subscription.subscriber : null
          })
        };
      } else {
        console.error('ConvertKit API error:', data);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            error: data.error || 'Error from ConvertKit API',
            details: data
          })
        };
      }
    } catch (fetchError) {
      console.error('Network error calling ConvertKit API:', fetchError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Network error calling ConvertKit API',
          details: fetchError.message
        })
      };
    }
  } catch (error) {
    console.error('General subscription error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Server error processing subscription',
        details: error.message
      })
    };
  }
};
