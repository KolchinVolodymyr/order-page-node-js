const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const crypto = require('crypto');
const useragent = require('express-useragent');
const ip_address = null;
// Defining key
const secret = 'Hi';

// Calling createHash method
const hash = crypto.createHash('sha256', secret).digest('hex');

// Displays output
console.log(hash);
dotenv.config();

const BigCommerce = require('node-bigcommerce');
const bigCommerce = new BigCommerce({
    clientId: 'im323r7hwohik173g1i9ztxjza3vx6l',
    accessToken: 'sf4tp902y47cne0yxmu80la3h15g7ww',
    storeHash: '85kzbf18qd',
    responseType: 'json',
});
const bigCommerceV3 = new BigCommerce({
    clientId: 'im323r7hwohik173g1i9ztxjza3vx6l',
    accessToken: 'sf4tp902y47cne0yxmu80la3h15g7ww',
    storeHash: '85kzbf18qd',
    responseType: 'json',
    apiVersion: 'v3' // Default is v2
});
const app = express();
app.use(useragent.express());

app.use(bodyParser.json())

    bigCommerce.get('/hooks')
        .then(data => {
            let webhooks = data;
            let scopes = webhooks.map(a => a.scope);
            const hookBody = {
                "scope": "store/order/created",
                "destination": "https://23dd-188-230-124-168.ngrok.io/webhooks",
                "is_active": true
            }

        console.log(scopes);

        if (scopes.indexOf("store/order/created") > -1 || scopes.indexOf("store/order/*") > -1) {
            console.log("Order webhook already exists");
        } else {
            bigCommerce.post('/hooks', hookBody)
                .then(data => {
                    console.log('Order webhook created');
                }).catch((error) => {
                    console.log('Error: (webhook created)', error);
                })
        }

        }).catch((error) => {
            console.log('Error: (bigCommerce.get(/hooks)', error);
        });

    app.post('/webhooks', function (req, res) {
        res.send('OK');
        let webhook = req.body;
        let orderId = webhook.data.id;
        let browser = req.useragent.browser;
        let version = req.useragent.version;
        //version 2 IP
        bigCommerce.get(`/orders/${orderId}`)
        .then(data => {
            const ip_address = data.ip_address;
            return ip_address;
        }).then((IP) => {
            //version 2
            bigCommerce.get(`/orders/${orderId}/products`)
                .then(data => {
                    let product = [];
                    data.forEach((el)=>{
                        let product_options = [];
                        el.product_options.forEach((index)=>{
                            product_options.push(`{"display_name": "${index.display_name}", "display_value": "${index.display_value}"}`)
                        })
                       product.push(`{"id": "${el.id}", "name": "${el.name}", "base_price": "${el.base_price}", "quantity": "${el.quantity}", "product_options": [${product_options.toString()}], "hash": "${hash}","browser": "${browser}" , "version": "${version}", "ip_address" :"${IP}"}`);
                    });
                    /**/
                    bodyText = {
                        "permission_set": "write_and_sf_access",
                        "namespace": "Product Data",
                        "key": "id",
                        "value": "["+product.toString()+"]",
                        "description": "el.name",
                        "resource_type": "order",
                        "resource_id": orderId
                    }

                    //version 3
                    bigCommerceV3.post(`/orders/${orderId}/metafields`, bodyText)
                        .then(response => {
                        }).catch((error) => {
                            console.log('Error: BigCommerceV3.post', error);
                        })
                }).catch((error) => {
                    console.log('Error: BigCommerceV2.get', error);
                });
        }).catch((error) => {
            console.log('Error: BigCommerceV2.get', error);
        });

    });
    app.get('/orderProduct', cors(), function (req, res) {

        bigCommerceV3.get(`/orders/${req.query.order_id}/metafields`)
            .then(response => {
                res.send(JSON.stringify(response));
            }).catch((error) => {
                console.log('Error: BigCommerceV3.get', error);
            });
    });

http.createServer(app).listen(3000, () => {
    console.log('Express server listening on port 3000');
});