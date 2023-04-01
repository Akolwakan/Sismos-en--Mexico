const { 
            csv,
            json,
            select,
            selectAll,
            group,
            sort,
            timeParse,
            scaleLinear,
            scaleRadial,
            scaleTime,
            axisLeft,
            axisBottom,
            transition,
            geoMercator
} = d3;


//////////////////////////////////////////////
/////// Setting width and height

const width = window.innerWidth/2;
const height = window.innerWidth/8;
const mapHeight = window.innerWidth/4;
/////// DOM Elements settings

const divTime = select('.timeDIV')
    .attr('width', width)
    .attr('height', height);

const svgTime = select('.timeSVG')
    .attr('width', width)
    .attr('height', height);

const divMap = select('.mapDIV')
    .attr('width', width)
    .attr('height', mapHeight);

const svgMap = select('.mapSVG')
    .attr('width', width)
    .attr('height', mapHeight);
//////////////////////////////////

////////// DEFINICIÓN DE OTROS PARÁMETROS

/// Margin Setings
const margin = {
    top: 20,
    right: 10,
    bottom: 20,
    left: 40
};
//// Date Parsing
const parseDate = timeParse("%Y-%m-%dT%H:%M:%S");
const parseDate2 = timeParse("%Y-%m-%d");

/// CSV parsing
const parseData = (d) => {
    d.time = parseDate(d.Fecha + 'T' + d.Hora);
    d.geo = {lon: +d.Longitud, lat: +d.Latitud};
    d.Latitud = +d.Latitud;
    d.Longitud = +d.Longitud;
    d.Magnitud = +d.Magnitud;
    d.Profundidad = +d.Profundidad;
    return d;
};

/// Animation speed
const speed = (i) => {
    if (i == 1) {
        return 3000;
    } else if( i == 2 ) {
        return 2000;
    } else if (i == 3) {
        return 1000;
    } else if (i == 4) {
        return 500;
    } else if (i == 5) {
        return 300;
    } else if (i == 6) {
        return 100;
    } else if (i == 7) {
        return 50;
    } else {
        return 500;
    }
};

/// data and map files
const filePath = './sismos.csv';
const geoPath = './mexico.json';

/// today's date';
const now = new Date();

/// today to locale date string (local = México)
let currentDate = now.toLocaleDateString('es-MX');

document.getElementById("inf_date").max = currentDate;
document.getElementById("sup_date").max = currentDate;

//////////////////////////////////
/////////////////

//////// 

const animate = async() => {
    const data = await csv(filePath, parseData);
    const geo = await json(geoPath);

/// Map Projection, scale, etc.
    const mapProjection = geoMercator()
        .scale(mapHeight*2.5)
        .center([-104,26])
        .translate([width / 2, mapHeight / 2.5]);

/// Map plot
    svgMap
        .selectAll('path')
        .data(geo.features)
            .join(
                enter => enter
                    .append('path')
                    .attr('class', 'state')
                    .attr('d', d3.geoPath().projection(mapProjection))
                    .attr('fill', '#bec8ae')
                    .style('opacity', .7)
                    .style('stroke', 'black')
                    .style('stroke-width', '0.5px'),
                update => update
                    .attr('fill', '#bec8ae')
                    .style('opacity', .7)
                    .style('stroke', 'black')
                    .style('stroke-width', '0.5px')
                    .attr('class', 'estado'),
                exit => exit
                    .remove()
    );

/// 

    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

/// scatter plot y-axis  
    const y = scaleLinear()
        .domain([0, d3.max(data, d => d.Magnitud)])
        .range([h-margin.bottom, 0]);

    svgTime.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .call(axisLeft(y));

//Set the size of the red circle in the map plot based on the magnitude of the earthquake
    const r = scaleRadial()
        //.domain([0.1, 10])
        .domain([d3.min(data.map(d => d.Magnitud)), d3.max(data.map(d => d.Magnitud))])
        .range([20, 90]);

/// Set the color of circles on update in the scatter plot
    const c = (d) => {
        if (d >= 5 && d < 7) {
            return 'orange';
        } else if (d >= 7) {
            return 'red';
        } else {
            return 'grey';
        }
    };

/////////
    let anim;
    let i = 0;
    let loc = [];

    const animBut = document.getElementById("animate");

    animBut.onclick = (event) => {
        animBut.disabled = true;

//// Get values from user
        let a = document.getElementById('inf_date').value;
        let b = document.getElementById('sup_date').value;
        let v = document.getElementById('speed').value;

/// Check dates from user
        if  (parseDate2(a) < parseDate2('1900-01-01') ) {
            a = '2017-09-19';
            b = '2017-09-20';
        }
        if (parseDate2(b) < parseDate2(a)) {
            a = '2017-09-19';
            b = '2017-09-20';
        }

/// Filter data and sort
        const dataF = data.filter(f => {
            return f.time >= new Date(parseDate2(a)) && f.time <= new Date(parseDate2(b));
        }).sort((a,b) => d3.ascending(a.time,b.time));

/// x-axis change when the user values change, so it's define after the click button event'
        const x = scaleTime()
            .domain([d3.min(dataF, d => d.time) , d3.max(dataF, d => d.time)])
            .range([0, w]);

        svgTime.selectAll('.x-axis').data([null]).join('g')
            .attr('class', 'x-axis')
            .attr('transform',`translate(${margin.left},${h})`)
            .call(axisBottom(x).ticks(10));
/// group data by time
        const groupData = group(dataF, d => d.time);


/// animation
        anim = setInterval( () => {

            if (i < [...groupData].length) {

/// date i from group data
                let day = new Date([...groupData][i][0]);

/// next date i
                i++;

///filter data <= date i
                loc = dataF.filter(f => f.time <= day);

/// Set the date and time in DOM element 
                document.getElementById('date').innerHTML = day.toLocaleDateString('es-MX') + ' ' + day.toLocaleTimeString('es-MX');

// scat plot
                svgTime.selectAll('.time')
                    .data(loc)
                    .join(
                        enter => enter
                            .append('circle')
                            .attr('class', 'time')
                            .attr('cx', d => x(d.time))
                            .attr('cy', d => y(d.Magnitud))
                            .attr('r', 5)
                            .style('opacity', 0.7)
                            .attr('transform', `translate(${margin.left}, ${margin.top})`)
                            .attr('fill', 'blue'),
                        update => update
                            .attr('cx', d => x(d.time))
                            .attr('cy', d => y(d.Magnitud))
                            .attr('r', 5)
                            .style('opacity', 0.5)
                            .attr('transform', `translate(${margin.left}, ${margin.top})`)
                            .attr('fill', d => c(d.Magnitud)),
                        exit => exit
                            .remove()
                    );


// map plot
                svgMap.selectAll('.loc')
                    .data(loc)
                    .join(
                        enter => enter
                            .append('circle')
                            .attr('class', 'loc')
                            .attr('cx', d => mapProjection([d.geo.lon, d.geo.lat])[0])
                            .attr('cy', d => mapProjection([d.geo.lon, d.geo.lat])[1])
                            .transition()
                            .duration(speed(v)*(3/4))
                            .attr('r', d => r(d.Magnitud) )
                            .style('opacity', 0.7)
                            .attr('fill', 'red'),
                        update => update
                            .style('opacity', 0.3)
                            .transition()
                            .duration(speed(v)*(1/4))
                            .attr('r', 5 )
                            .attr('fill', 'grey'),
                        exit => exit
                            .remove()
                    );

            } else {
                i = 0;
                loc = [];
            }

        },speed(v));
    };
/// stop and clear button
    const stopBut = document.getElementById("stop");
    stopBut.onclick = function(event) {
        document.getElementById("animate").disabled = false;

        clearInterval(anim);
        i = 0;
        loc = [];
    };
};

animate();


