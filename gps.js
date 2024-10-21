const connection = new WebSocket('ws://localhost:4001');

connection.onopen = () => {
    console.log('Connected to WebSocket server');
};

let satellitesData = [];
const distanceArray = [];
let satelliteVelocity = 120;

connection.onmessage = (event) => {
    console.log('Data received:', event.data);
    const incomingData = JSON.parse(event.data);

    const signalDelay = (incomingData.receivedTime - incomingData.sentTime) / 1000;
    const computedDistance = (satelliteVelocity / 3600) * signalDelay;

    satellitesData.push({ x: incomingData.x, y: incomingData.y });
    distanceArray.push(computedDistance);

    if (satellitesData.length === 3) {
        const estimatedPosition = calculateLocation(satellitesData, distanceArray);
        renderGraph(estimatedPosition, satellitesData);
        satellitesData.length = 0;
        distanceArray.length = 0;
    }
};

connection.onerror = (error) => {
    console.error('WebSocket error:', error);
};

function calculateLocation(satellites, distances) {
    const [satellite1, satellite2, satellite3] = satellites;
    const [dist1, dist2, dist3] = distances;

    const a = 2 * satellite2.x - 2 * satellite1.x;
    const b = 2 * satellite2.y - 2 * satellite1.y;
    const c = dist1 ** 2 - dist2 ** 2 - satellite1.x ** 2 + satellite2.x ** 2 - satellite1.y ** 2 + satellite2.y ** 2;

    const d = 2 * satellite3.x - 2 * satellite2.x;
    const e = 2 * satellite3.y - 2 * satellite2.y;
    const f = dist2 ** 2 - dist3 ** 2 - satellite2.x ** 2 + satellite3.x ** 2 - satellite2.y ** 2 + satellite3.y ** 2;

    const x = (c - (b / a) * (f - (e / d) * d)) / (b - (b / a) * e);
    const y = (c - a * x) / b;

    return { x, y };
}

function renderGraph(objectPosition, satelliteLocations) {
    const traceObj = {
        x: [objectPosition.x],
        y: [objectPosition.y],
        mode: 'markers',
        type: 'scatter',
        name: 'Object',
        marker: { size: 12, color: 'green' }
    };

    const traceSat = {
        x: satelliteLocations.map(sat => sat.x),
        y: satelliteLocations.map(sat => sat.y),
        mode: 'markers',
        type: 'scatter',
        name: 'Satellite',
        marker: { size: 10, color: 'orange' }
    };

    const plotData = [traceObj, traceSat];

    const chartLayout = {
        xaxis: {
            title: 'X Coordinate',
            range: [-300, 300]
        },
        yaxis: {
            title: 'Y Coordinate',
            range: [-300, 300]
        }
    };

    Plotly.newPlot('locationChart', plotData, chartLayout);
}

function applySettings() {
    const satVelocityInput = document.getElementById('satVelocity').value;
    const objVelocityInput = document.getElementById('objVelocity').value;

    const updatedSettings = {
        satVelocity: parseInt(satVelocityInput) || 120,
        objVelocity: parseInt(objVelocityInput) || 15
    };

    fetch('http://localhost:4001/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedSettings)
    })
    .then(response => response.json())
    .then(data => console.log('Settings updated:', data))
    .catch(error => console.error('Error updating settings:', error));
}
