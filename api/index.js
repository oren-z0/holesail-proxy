const process = require('process');
const { Readable } = require('stream');
const express = require("express");
const HolesailClient = require("holesail-client");
const app = express();

let holesailClient = undefined;
let holesailClientTimeout = undefined;



async function createHolesailClient() {
    if (holesailClientTimeout) {
        clearTimeout(holesailClientTimeout);
    }
    holesailClientTimeout = setTimeout(() => {
        if (holesailClient) {
            console.info("Destroying holesail client");
            try {
                holesailClient.destroy();
            } finally {
                holesailClient = undefined;
            }
        }
    }, 10_000);
    if (holesailClient) {
        console.info("Holesail client already created");
        return holesailClient;
    }
    console.info("Creating holesail client");
    holesailClient = new HolesailClient(process.env.HOLESAIL_BUFF_SEED, 'secure');
    await new Promise((resolve, reject) => {
        holesailClient.connect({ port: 8080, address: '127.0.0.1' }, resolve);
        setTimeout(() => reject(new Error('failed to connect to holesail client')), 5000);
    });
    return holesailClient;
}

app.get("/", async (req, res) => {
    try {
        await createHolesailClient();
        const fetchResult = await fetch('http://127.0.0.1:8080');
        res.status(fetchResult.status);
        Readable.fromWeb(fetchResult.body).pipe(res);
    } catch (error) {
        res.status(500).send(`Failed: ${error}`);
    }
});

app.get("/buff-seed", (req, res) => res.send(process.env.HOLESAIL_BUFF_SEED.slice(0, 4)));

module.exports = app;
