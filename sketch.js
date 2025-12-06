// ===== CONFIGURAZIONE =====
const CONFIG = {
    colors: {
        background: '#ffffffff',
        text: '#000000ff',
        accent: '#FF2B00',
        accentLight: '#FF2B00',
        circle: '#111010b3',
        continentBase: '#FF2B00',
        highlightGlow: '#FF2B00',
        infoBox: '#ffffffff',
        infoBoxText: '#000000ff',
        infoBoxStroke: '#000000ff',
        timeline: '#FF2B00',
        selectedContinent: '#b9b9b988'
    },
    layout: {
        centerXRatio: 0.5,
        maxRadius: 342,
        minRadius: 31.5,
        continentLabelOffset: 70,
        europeAsiaOffset: 45,
        infoBoxWidth: 350,
        infoBoxHeight: 120,
        bottomControlY: 100,
        marginX: 60,
        fontSizeControls: 48,
        centerYOffset: 54,
        topOffset: -20,
        // NUOVA PROPRIETÀ PER POSIZIONARE LA LEGENDA
        legendBoxY: 60,
        // AUMENTATA L'ALTEZZA DELLA LEGENDA
        legendBoxHeight: 300,
        // POSIZIONE DELLA INFOBOX DEL VULCANO (più in basso)
        volcanoInfoBoxY: 380
    },
    centuries: [
        { label: 'all centuries', value: null },
        { label: '4200 BC', value: -4200 },
        { label: '3200 BC', value: -3200 },
        { label: '2200 BC', value: -2200 },
        { label: '1200 BC', value: -1200 },
        { label: '200 BC', value: -200 },
        { label: '800 AD', value: 800 },
        { label: '1800 AD', value: 1800 },
        { label: '1850 AD', value: 1850 },
        { label: '1900 AD', value: 1900 },
        { label: '1950 AD', value: 1950 },
        { label: '2000 AD', value: 2000 },
        { label: '2050 AD', value: 2050 }
    ]
};

let impactLevels = [];
let allImpacts = [];

const CONCENTRIC_YEARS = [-4200, -3200, -2200, -1200, -200, 800, 1800, 1850, 1900, 1950, 2000, 2050];

// ===== STATO APPLICAZIONE =====
let state = {
    volcanoData: [],
    filteredData: [],
    selectedCentury: null,
    selectedContinent: null,
    hoveredVolcano: null,
    hoveredContinent: null,
    timelineYear: null,
    centerX: 0,
    centerY: 0,
    continentAngles: {},
    continentCounts: {},
    volcanoPositions: new Map(),
    globalYearRange: { min: 0, max: 0 },
    timelineButtons: [],
    currentCenturiesIndex: 0,
    currentYearIndex: 0,
    isPlaying: false,
    leftControlAreas: null,
    rightControlAreas: null,
    asiaLabelY: 0,
    // VARIABILI PER ANIMAZIONE
    animationTimer: 0,
    animationSpeed: 200,
    pauseBetweenCycles: 1000,
    isPausedBetweenCycles: false,
    // NUOVA VARIABILE PER HOVER LEGENDA
    hoveredImpactLevel: null
};

// Variabile per l'immagine di sfondo radiale
let radialBgImage;

// ===== MAPPATURA CONTINENTI =====
const CONTINENT_MAP = {
    'Arabia-S': 'Asia', 'Arabia-W': 'Asia', 'China-S': 'Asia', 'Halmahera-Indonesia': 'Asia',
    'Hokkaido-Japan': 'Asia', 'Honshu-Japan': 'Asia', 'Indonesia': 'Asia', 'Izu Is-Japan': 'Asia',
    'Java': 'Asia', 'Kamchatka': 'Asia', 'Kuril Is': 'Asia', 'Kyushu-Japan': 'Asia',
    'Lesser Sunda Is': 'Asia', 'Luzon-Philippines': 'Asia', 'Mindanao-Philippines': 'Asia',
    'Philippines-C': 'Asia', 'Ryukyu Is': 'Asia', 'Sangihe Is-Indonesia': 'Asia',
    'Sulawesi-Indonesia': 'Asia', 'Sumatra': 'Asia', 'Turkey': 'Asia',
    
    'Alaska Peninsula': 'Americhe', 'Alaska-SW': 'Americhe', 'Aleutian Is': 'Americhe',
    'Canada': 'Americhe', 'Chile-C': 'Americhe', 'Chile-S': 'Americhe', 'Colombia': 'Americhe',
    'Costa Rica': 'Americhe', 'Ecuador': 'Americhe', 'El Salvador': 'Americhe', 'Galapagos': 'Americhe',
    'Guatemala': 'Americhe', 'Hawaiian Is': 'Americhe', 'Mexico': 'Americhe', 'Nicaragua': 'Americhe',
    'Peru': 'Americhe', 'US-Oregon': 'Americhe', 'US-Washington': 'Americhe', 'US-Wyoming': 'Americhe',
    'W Indies': 'Americhe',
    
    'Azores': 'Europa', 'Canary Is': 'Europa', 'Greece': 'Europa', 'Iceland-NE': 'Europa',
    'Iceland-S': 'Europa', 'Iceland-SE': 'Europa', 'Iceland-SW': 'Europa', 'Italy': 'Europa',
    
    'Admiralty Is-SW Paci': 'Oceania', 'Banda Sea': 'Oceania', 'Bougainville-SW Paci': 'Oceania',
    'Kermadec Is': 'Oceania', 'New Britain-SW Pac': 'Oceania', 'New Guinea': 'Oceania',
    'New Guinea-NE of': 'Oceania', 'New Zealand': 'Oceania', 'Samoa-SW Pacific': 'Oceania',
    'Santa Cruz Is-SW Pac': 'Oceania', 'Solomon Is-SW Pacifi': 'Oceania', 'Tonga-SW Pacific': 'Oceania',
    'Vanuatu-SW Pacific': 'Oceania',
    
    'Africa-C': 'Africa', 'Africa-E': 'Africa', 'Africa-NE': 'Africa', 'Africa-W': 'Africa',
    'Cape Verde Is': 'Africa', 'Indian O-W': 'Africa', 'Red Sea': 'Africa'
};

const CONTINENTS = ['Asia', 'Americhe', 'Europa', 'Oceania', 'Africa'];

function preload() {
    loadTable('assets/data_impatto.csv', 'csv', 'header', processTableData);
    radialBgImage = loadImage('assets/radial_bg.png');
}

function processTableData(table) {
    state.volcanoData = [];
    allImpacts = [];
    
    for (let r = 0; r < table.getRowCount(); r++) {
        let row = table.getRow(r);
        let location = row.getString('Location');
        
        let deaths = parseInt(row.getString('Deaths')) || 0;
        let impact = parseInt(row.getString('Impact')) || 1;
        
        if (!isNaN(impact)) {
            allImpacts.push(impact);
        }
        
        state.volcanoData.push({
            year: parseInt(row.getString('Year')) || 0,
            name: row.getString('Name'),
            location: location,
            country: row.getString('Country'),
            type: row.getString('Type'),
            impact: impact,
            deaths: deaths,
            continent: CONTINENT_MAP[location] || 'Sconosciuto'
        });
    }
    
    impactLevels = [...new Set(allImpacts)].sort((a, b) => a - b);
    
    if (!impactLevels.includes(15)) {
        impactLevels.push(15);
    }
    
    impactLevels.sort((a, b) => a - b);
    
    state.volcanoData.sort((a, b) => b.year - a.year);
    initializeData();
}

function initializeData() {
    state.filteredData = [...state.volcanoData];
    state.globalYearRange = getGlobalYearRange();
    calculateContinentData();
    calculateVolcanoPositions();
    calculateTimelineButtons();
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    updateLayout();
}

function updateLayout() {
    state.centerX = width * CONFIG.layout.centerXRatio;
    state.centerY = height / 2 + CONFIG.layout.centerYOffset;
    calculateTimelineButtons();
}

// ===== CALCOLI =====
function calculateContinentData() {
    state.continentCounts = CONTINENTS.reduce((acc, cont) => {
        acc[cont] = 0;
        return acc;
    }, {});
    
    state.volcanoData.forEach(v => {
        if (state.continentCounts[v.continent] !== undefined) {
            state.continentCounts[v.continent]++;
        }
    });
    
    let total = state.volcanoData.length;
    let startAngle = 0;
    
    state.continentAngles = {};
    CONTINENTS.forEach(cont => {
        let proportion = total > 0 ? state.continentCounts[cont] / total : 0;
        let angleSize = proportion * TWO_PI;
        
        state.continentAngles[cont] = {
            start: startAngle,
            end: startAngle + angleSize,
            mid: startAngle + angleSize / 2
        };
        
        startAngle += angleSize;
    });
}

function calculateVolcanoPositions() {
    state.volcanoPositions.clear();
    
    state.volcanoData.forEach(v => {
        let key = `${v.name}-${v.year}-${v.deaths}`;
        let angles = state.continentAngles[v.continent];
        if (angles && !state.volcanoPositions.has(key)) {
            state.volcanoPositions.set(key, random(angles.start, angles.end));
        }
    });
}

function getRadiusForImpact(impact) {
    if (impactLevels.length <= 1) return CONFIG.layout.minRadius;
    
    let idx = impactLevels.indexOf(impact);
    if (idx === -1) return CONFIG.layout.minRadius;
    
    const totalLevels = impactLevels.length;
    const normalized = idx / (totalLevels - 1);
    
    // MANTENIAMO LA CORRISPONDENZA ORIGINALE: impatto 1 (più esterno) → maxRadius, impatto 16 (più interno) → minRadius
    // Questo è già corretto nel codice esistente
    return map(normalized, 0, 1, CONFIG.layout.maxRadius, CONFIG.layout.minRadius);
}

function drawImpactCircles() {
    for (let i = 0; i < impactLevels.length; i++) {
        // CALCOLA IL RAGGIO: dalla più interna (impatti alti) alla più esterna (impatti bassi)
        // i=0 → impactLevels[0] (impatto più basso, es: 1) → raggio più GRANDE (esterno)
        // i=ultimo → impactLevels[ultimo] (impatto più alto, es: 16) → raggio più PICCOLO (interno)
        let radius = map(i, 0, impactLevels.length - 1, 
                        CONFIG.layout.maxRadius, CONFIG.layout.minRadius);
        noFill();
        
        // MODIFICATO: HOVER IN NERO
        if (state.hoveredImpactLevel === impactLevels[i]) {
            stroke(0); // NERO invece di CONFIG.colors.accent
            strokeWeight(3);
        } else {
            stroke(CONFIG.colors.circle);
            strokeWeight(0.5);
        }
        
        ellipse(0, 0, radius * 2);
    }
}

function calculateTimelineButtons() {
    state.timelineButtons = [];
    const tlY = height - CONFIG.layout.bottomControlY;
    const tlXStart = width * 0.2;
    const tlXEnd = width * 0.8;
    const tlW = tlXEnd - tlXStart;
    
    state.timelineButtons.push({
        label: 'all centuries',
        value: null,
        x: tlXStart - 40,
        y: tlY,
        radius: 8
    });
    
    CONCENTRIC_YEARS.forEach((year, i) => {
        const normalized = i / (CONCENTRIC_YEARS.length - 1);
        const xPos = tlXStart + normalized * tlW;
        
        state.timelineButtons.push({
            label: formatYearShort(year),
            value: year,
            x: xPos,
            y: tlY,
            radius: 8
        });
    });
}

function applyFilters() {
    state.filteredData = state.volcanoData.filter(v => {
        let centuryMatch = true;
        
        if (state.selectedCentury !== null) {
            const centuryIndex = CONCENTRIC_YEARS.indexOf(state.selectedCentury);
            if (centuryIndex !== -1 && centuryIndex < CONCENTRIC_YEARS.length - 1) {
                const startYear = CONCENTRIC_YEARS[centuryIndex];
                const endYear = CONCENTRIC_YEARS[centuryIndex + 1];
                
                if (centuryIndex === CONCENTRIC_YEARS.length - 2) {
                    centuryMatch = (v.year >= startYear && v.year <= endYear);
                } else {
                    centuryMatch = (v.year >= startYear && v.year < endYear);
                }
            } else {
                centuryMatch = false;
            }
        }
        
        const continentMatch = state.selectedContinent === null || 
                             v.continent === state.selectedContinent;
        return centuryMatch && continentMatch;
    });

    calculateContinentData();
    state.timelineYear = null;
}

function getGlobalYearRange() {
    const years = state.volcanoData.map(v => v.year);
    return {
        min: Math.min(...years),
        max: Math.max(...years)
    };
}

// ===== ANIMAZIONE =====
function updateAnimation() {
    if (!state.isPlaying) return;
    
    const years = getEruptionYears();
    if (years.length === 0) return;
    
    // Controlla se siamo in pausa tra i cicli
    if (state.isPausedBetweenCycles) {
        state.animationTimer += deltaTime;
        if (state.animationTimer >= state.pauseBetweenCycles) {
            state.animationTimer = 0;
            state.isPausedBetweenCycles = false;
            state.currentYearIndex = 0;
        }
        return;
    }
    
    // Avanza l'animazione
    state.animationTimer += deltaTime;
    
    // Controlla se è il momento di passare all'anno successivo
    if (state.animationTimer >= state.animationSpeed) {
        state.animationTimer = 0;
        
        if (state.currentYearIndex < years.length - 1) {
            state.currentYearIndex++;
        } else {
            state.isPausedBetweenCycles = true;
            return;
        }
    }
    
    // Aggiorna l'anno corrente per la visualizzazione
    state.timelineYear = years[state.currentYearIndex];
}

// ===== FUNZIONI DI DISEGNO =====
function draw() {
    background(CONFIG.colors.background);
    updateLayout();
    
    // Aggiorna l'animazione
    updateAnimation();
    
    drawTitle();
    drawLegendBox();
    drawInfoBox();
    drawMainCircle();
    drawContinentLabels();
    drawTemporalRangeSelector();
    drawYearSelector();
    drawSelectedYearCount();
    
    // Controlla hover della legenda
    checkLegendHover();
}

function drawTitle() {
    textSize(96);
    textFont('Helvetica');
    textStyle(BOLD);
    textAlign(LEFT, TOP);
    
    const titleY = 60 + CONFIG.layout.topOffset;
    
    fill(CONFIG.colors.text);
    text('SIGNIFICANT VOLCANIC', CONFIG.layout.marginX, titleY);
    
    fill(CONFIG.colors.accent);
    text('ERUPTION', CONFIG.layout.marginX, titleY + 100);
    
    textStyle(NORMAL);
}

function drawLegendBox() {
    const boxX = width - CONFIG.layout.infoBoxWidth - CONFIG.layout.marginX;
    const boxY = CONFIG.layout.legendBoxY;
    const boxW = CONFIG.layout.infoBoxWidth;
    const boxH = CONFIG.layout.legendBoxHeight;
    
    // BOX BIANCO CON BORDO NERO
    fill(CONFIG.colors.infoBox);
    stroke(CONFIG.colors.infoBoxStroke);
    strokeWeight(1);
    rect(boxX, boxY, boxW, boxH, 10, 10, 10, 10);
    
    fill(CONFIG.colors.infoBoxText);
    noStroke();
    textFont('Helvetica');
    textAlign(LEFT, TOP);
    
    // TITOLO LEGENDA
    textSize(18);
    textStyle(BOLD);
    text('IMPACT LEVELS', boxX + 20, boxY + 20);
    textStyle(NORMAL);
    
    // DESCRIZIONE
    textSize(14);
    text('Hover over impact levels to highlight', 
         boxX + 20, boxY + 50);
    text('corresponding circles', 
         boxX + 20, boxY + 70);
    
    // LISTA DEI LIVELLI DI IMPATTO DIVISI IN DUE COLONNE
    const startY = boxY + 95;
    const levelSpacing = 25;
    const columnWidth = (boxW - 40) / 2;
    
    // Calcola quanti livelli per colonna (circa metà)
    const levelsPerColumn = Math.ceil(impactLevels.length / 2);
    
    // Prima colonna
    for (let i = 0; i < levelsPerColumn; i++) {
        if (i >= impactLevels.length) break;
        
        const level = impactLevels[i];
        const yPos = startY + (i * levelSpacing);
        const isHovered = (state.hoveredImpactLevel === level);
        
        // CERCHIETTO COLORATO
        if (isHovered) {
            fill(CONFIG.colors.accent);
            noStroke();
        } else {
            fill(CONFIG.colors.infoBoxText);
            noStroke();
        }
        circle(boxX + 20, yPos, 8);
        
        // TESTO
        fill(isHovered ? CONFIG.colors.accent : CONFIG.colors.infoBoxText);
        textSize(12);
        text(`Impact ${level}`, boxX + 40, yPos + 3);
    }
    
    // Seconda colonna
    for (let i = levelsPerColumn; i < impactLevels.length; i++) {
        const level = impactLevels[i];
        const yPos = startY + ((i - levelsPerColumn) * levelSpacing);
        const isHovered = (state.hoveredImpactLevel === level);
        
        // CERCHIETTO COLORATO
        if (isHovered) {
            fill(CONFIG.colors.accent);
            noStroke();
        } else {
            fill(CONFIG.colors.infoBoxText);
            noStroke();
        }
        circle(boxX + 20 + columnWidth, yPos, 8);
        
        // TESTO
        fill(isHovered ? CONFIG.colors.accent : CONFIG.colors.infoBoxText);
        textSize(12);
        text(`Impact ${level}`, boxX + 40 + columnWidth, yPos + 3);
    }
}

function drawInfoBox() {
    const boxX = width - CONFIG.layout.infoBoxWidth - CONFIG.layout.marginX;
    const boxY = CONFIG.layout.volcanoInfoBoxY;
    const boxW = CONFIG.layout.infoBoxWidth;
    const boxH = CONFIG.layout.infoBoxHeight;
    
    fill(CONFIG.colors.infoBox);
    stroke(CONFIG.colors.infoBoxStroke);
    strokeWeight(1);
    rect(boxX, boxY, boxW, boxH, 10, 10, 10, 10);
    
    if (state.hoveredVolcano) {
        drawVolcanoInfo(boxX, boxY);
    } else {
        fill(CONFIG.colors.infoBoxText);
        noStroke();
        textSize(14);
        textFont('Helvetica');
        textAlign(LEFT, TOP);
        text('HOVER A VOLCANO', boxX + 20, boxY + 20);
    }
}

function drawVolcanoInfo(boxX, boxY) {
    const v = state.hoveredVolcano;
    fill(CONFIG.colors.infoBoxText);
    noStroke();
    textFont('Helvetica');
    textAlign(LEFT, TOP);
    
    textSize(18);
    textStyle(BOLD);
    text(v.name.toUpperCase(), boxX + 20, boxY + 20);
    textStyle(NORMAL);
    
    textSize(14);
    text(v.country.toUpperCase() + ' • LAST ERUPTION: ' + formatYearShort(v.year).toUpperCase(), 
         boxX + 20, boxY + 50);
}

function drawTemporalRangeSelector() {
    const fontSize = CONFIG.layout.fontSizeControls;
    
    const x = CONFIG.layout.marginX;
    const y = state.asiaLabelY - 10;
    
    fill(CONFIG.colors.text);
    noStroke();
    textSize(fontSize);
    textFont('Helvetica');
    textStyle(BOLD);
    textAlign(LEFT, CENTER);
    
    const current = CONFIG.centuries[state.currentCenturiesIndex];
    let label = current.label.toUpperCase();
    if (current.value === null) label = 'ALL CENTURIES';
    
    if (state.currentCenturiesIndex > 0) {
        if (state.currentCenturiesIndex < CONFIG.centuries.length - 1) {
            const nextLabel = CONFIG.centuries[state.currentCenturiesIndex + 1].label.toUpperCase();
            label = label + '–' + nextLabel;
        }
        else if (state.currentCenturiesIndex === CONFIG.centuries.length - 1) {
            label = '2000 AD–2050 AD';
        }
    }
    
    const fullText = `< ${label} >`;
    text(fullText, x, y);
    
    const textWidthVal = textWidth(fullText);
    
    state.leftControlAreas = {
        leftButton: {
            x: x - 30,
            y: y - fontSize/2,
            width: textWidth('<') + 60,
            height: fontSize + 10
        },
        rightButton: {
            x: x + textWidthVal - textWidth('>') - 30,
            y: y - fontSize/2,
            width: textWidth('>') + 60,
            height: fontSize + 10
        }
    };
    
    textStyle(NORMAL);
}

function drawYearSelector() {
    const fontSize = CONFIG.layout.fontSizeControls;
    
    const x = width - CONFIG.layout.marginX;
    const y = state.asiaLabelY - 10;
    
    fill(CONFIG.colors.text);
    noStroke();
    textSize(fontSize);
    textFont('Helvetica');
    textStyle(BOLD);
    textAlign(RIGHT, CENTER);
    
    const years = getEruptionYears();
    let yearLabel = '——';
    if (years.length > 0) {
        const idx = constrain(state.currentYearIndex, 0, years.length - 1);
        yearLabel = formatYearShort(years[idx]).toUpperCase();
    }
    
    const fullText = `< ${yearLabel} >`;
    
    const playPauseX = x - textWidth(fullText) - 70;
    drawPlayPauseIcon(playPauseX, y);
    
    text(fullText, x, y);
    
    const textWidthVal = textWidth(fullText);
    const textX = x - textWidthVal;
    
    state.rightControlAreas = {
        playPause: {
            x: playPauseX - 25,
            y: y - 25,
            width: 50,
            height: 50
        },
        leftButton: {
            x: textX - 30,
            y: y - fontSize/2,
            width: textWidth('<') + 60,
            height: fontSize + 10
        },
        rightButton: {
            x: textX + textWidthVal - textWidth('>') - 30,
            y: y - fontSize/2,
            width: textWidth('>') + 60,
            height: fontSize + 10
        }
    };
    
    textStyle(NORMAL);
}

function drawPlayPauseIcon(x, y) {
    if (!state.isPlaying) {
        fill(CONFIG.colors.accent);
        noStroke();
        triangle(x - 15, y - 20, x + 15, y, x - 15, y + 20);
    } else {
        fill(CONFIG.colors.accent);
        noStroke();
        rect(x - 12, y - 22, 10, 44);
        rect(x + 2, y - 22, 10, 44);
    }
}

function drawSelectedYearCount() {
    if (state.timelineYear !== null && state.filteredData.length > 0) {
        const eruptionsCount = state.filteredData.filter(v => v.year === state.timelineYear).length;
        if (eruptionsCount > 0) {
            const x = width - 120;
            const y = CONFIG.layout.volcanoInfoBoxY + CONFIG.layout.infoBoxHeight + 40;
            fill(CONFIG.colors.text);
            textSize(14);
            textFont('Helvetica');
            textAlign(RIGHT, TOP);
            text(eruptionsCount + ' ERUPTIONS', x, y);
        }
    }
}

function drawMainCircle() {
    push();
    translate(state.centerX, state.centerY);
    
    if (radialBgImage) {
        let imageDim = 2;
        let imageSize = CONFIG.layout.maxRadius * imageDim;
        imageMode(CENTER);
        image(radialBgImage, 0, 0, imageSize, imageSize);
    }
    
    drawImpactCircles();
    drawContinentDividers();
    drawHoveredContinentSlice();
    
    if (state.filteredData.length > 0) {
        drawVolcanoes();
    }
    
    pop();
    
    if (state.filteredData.length > 0) {
        checkHover();
        checkContinentHover();
    } else {
        state.hoveredVolcano = null;
        state.hoveredContinent = null;
    }
}

function drawHoveredContinentSlice() {
    if (state.hoveredContinent) {
        const angles = state.continentAngles[state.hoveredContinent];
        if (angles && angles.start !== angles.end) {
            fill(CONFIG.colors.selectedContinent);
            noStroke();
            strokeWeight(0.5);
            arc(0, 0, CONFIG.layout.maxRadius * 2, CONFIG.layout.maxRadius * 2, 
                angles.start, angles.end, PIE);
        }
    }
}

function drawContinentDividers() {
    stroke(CONFIG.colors.circle);
    strokeWeight(1);
    
    CONTINENTS.forEach(cont => {
        const angles = state.continentAngles[cont];
        if (angles) {
            line(0, 0, 
                 cos(angles.start) * CONFIG.layout.maxRadius, 
                 sin(angles.start) * CONFIG.layout.maxRadius);
        }
    });
}

function drawVolcanoes() {
    state.filteredData.forEach(v => {
        let key = `${v.name}-${v.year}-${v.deaths}`;
        let angle = state.volcanoPositions.get(key);
        const angles = state.continentAngles[v.continent];

        if (!angle && angles) angle = angles.mid;
        if (!angle) return; 

        const r = getRadiusForImpact(v.impact);
        const x = cos(angle) * r;
        const y = sin(angle) * r;

        const isHighlighted = (state.timelineYear !== null && v.year === state.timelineYear);
        const isHovered = (state.hoveredVolcano === v);

        if (isHighlighted || isHovered) {
            drawVolcanoGlow(v, x, y, isHighlighted, isHovered);
        }
        drawVolcanoDot(x, y, isHighlighted, isHovered);
    });
}

function drawVolcanoGlow(volcano, x, y, isHighlighted, isHovered) {
    let glowSize, alpha;
    
    if (isHighlighted) {
        glowSize = map(volcano.impact, 5, 15, 60, 90);
        alpha = map(volcano.impact, 5, 15, 70, 100);
    } else {
        glowSize = map(volcano.impact, 5, 15, 50, 80);
        alpha = map(volcano.impact, 5, 15, 60, 90);
    }

    fill(255, 43, 0, alpha);
    noStroke();
    circle(x, y, glowSize);
}

function drawVolcanoDot(x, y, isHighlighted, isHovered) {
    if (isHighlighted) {
        fill(CONFIG.colors.highlightGlow);
        noStroke();
        circle(x, y, 10);
    } else if (isHovered) {
        fill(CONFIG.colors.text);
        noStroke();
        circle(x, y, 8);
    } else {
        fill(CONFIG.colors.text);
        noStroke();
        circle(x, y, 4);
    }
}

function drawContinentLabels() {
    CONTINENTS.forEach(cont => {
        const angles = state.continentAngles[cont];
        if (!angles) return;

        const angle = angles.mid;
        
        let r;
        if (cont === 'Europa' || cont === 'Asia') {
            r = CONFIG.layout.maxRadius + CONFIG.layout.europeAsiaOffset;
        } else {
            r = CONFIG.layout.maxRadius + CONFIG.layout.continentLabelOffset;
        }
        
        const x = state.centerX + cos(angle) * r;
        const y = state.centerY + sin(angle) * r;
        
        if (cont === 'Asia') {
            state.asiaLabelY = y;
        }

        drawContinentBullet(x, y, cont);
        drawContinentLabel(x, y, cont);
    });
}

function drawContinentBullet(x, y, continent) {
    const isHovered = (state.hoveredContinent === continent);

    if (isHovered) {
        fill(CONFIG.colors.text);
        noStroke();
        circle(x - 30, y, 14);
    } else {
        stroke(CONFIG.colors.accent);
        strokeWeight(2);
        noFill();
        circle(x - 30, y, 12);
    }
}

function drawContinentLabel(x, y, continent) {
    const isHovered = (state.hoveredContinent === continent);
    fill(isHovered ? CONFIG.colors.text : CONFIG.colors.text);
    noStroke();
    textSize(14);
    textAlign(LEFT, CENTER);
    text(continent, x - 10, y);
}

// ===== HOVER LEGENDA =====
function checkLegendHover() {
    state.hoveredImpactLevel = null;
    
    const boxX = width - CONFIG.layout.infoBoxWidth - CONFIG.layout.marginX;
    const boxY = CONFIG.layout.legendBoxY;
    const startY = boxY + 95;
    const levelSpacing = 25;
    const columnWidth = (CONFIG.layout.infoBoxWidth - 40) / 2;
    const levelsPerColumn = Math.ceil(impactLevels.length / 2);
    
    // Controlla se il mouse è sopra l'area della legenda
    if (mouseX > boxX && mouseX < boxX + CONFIG.layout.infoBoxWidth &&
        mouseY > startY && mouseY < startY + (levelsPerColumn * levelSpacing)) {
        
        // Prima colonna
        if (mouseX < boxX + columnWidth) {
            const levelIndex = Math.floor((mouseY - startY) / levelSpacing);
            if (levelIndex >= 0 && levelIndex < levelsPerColumn && levelIndex < impactLevels.length) {
                state.hoveredImpactLevel = impactLevels[levelIndex];
            }
        }
        // Seconda colonna
        else {
            const levelIndex = Math.floor((mouseY - startY) / levelSpacing);
            const actualIndex = levelIndex + levelsPerColumn;
            if (levelIndex >= 0 && actualIndex < impactLevels.length) {
                state.hoveredImpactLevel = impactLevels[actualIndex];
            }
        }
    }
}

// ===== INTERAZIONI =====
function checkHover() {
    if (state.filteredData.length === 0) {
        state.hoveredVolcano = null;
    } else {
        let newHovered = null;
        let minDist = Infinity;
        
        state.filteredData.forEach(v => {
            const angles = state.continentAngles[v.continent];
            if (!angles) return;

            const key = `${v.name}-${v.year}-${v.deaths}`;
            const angle = state.volcanoPositions.get(key) || angles.mid;
            const r = getRadiusForImpact(v.impact);
            const x = state.centerX + cos(angle) * r;
            const y = state.centerY + sin(angle) * r;

            const d = dist(mouseX, mouseY, x, y);
            if (d < 15 && d < minDist) {
                minDist = d;
                newHovered = v;
            }
        });
        
        state.hoveredVolcano = newHovered;
    }
}

function checkContinentHover() {
    state.hoveredContinent = null;
    
    const mouseDistFromCenter = dist(mouseX, mouseY, state.centerX, state.centerY);
    
    CONTINENTS.forEach(cont => {
        const angles = state.continentAngles[cont];
        if (!angles) return;

        const angle = angles.mid;
        
        let r;
        if (cont === 'Europa' || cont === 'Asia') {
            r = CONFIG.layout.maxRadius + CONFIG.layout.europeAsiaOffset;
        } else {
            r = CONFIG.layout.maxRadius + CONFIG.layout.continentLabelOffset;
        }
        
        const x = state.centerX + cos(angle) * r;
        const y = state.centerY + sin(angle) * r;

        const hoverThreshold = (cont === 'Europa' || cont === 'Asia') ? 25 : 30;
        
        if (dist(mouseX, mouseY, x - 30, y) < hoverThreshold) {
            state.hoveredContinent = cont;
        }
    });
}

function mousePressed() {
    if (state.leftControlAreas) {
        const leftBtn = state.leftControlAreas.leftButton;
        const rightBtn = state.leftControlAreas.rightButton;
        
        if (mouseX > leftBtn.x && mouseX < leftBtn.x + leftBtn.width &&
            mouseY > leftBtn.y && mouseY < leftBtn.y + leftBtn.height) {
            if (state.currentCenturiesIndex === 0) {
                state.currentCenturiesIndex = CONFIG.centuries.length - 1;
            } else {
                state.currentCenturiesIndex = Math.max(0, state.currentCenturiesIndex - 1);
            }
            applyTemporalFilter();
            return;
        }
        
        if (mouseX > rightBtn.x && mouseX < rightBtn.x + rightBtn.width &&
            mouseY > rightBtn.y && mouseY < rightBtn.y + rightBtn.height) {
            if (state.currentCenturiesIndex === CONFIG.centuries.length - 1) {
                state.currentCenturiesIndex = 0;
            } else {
                state.currentCenturiesIndex = Math.min(CONFIG.centuries.length - 1, state.currentCenturiesIndex + 1);
            }
            applyTemporalFilter();
            return;
        }
    }
    
    if (state.rightControlAreas) {
        const leftBtn = state.rightControlAreas.leftButton;
        const rightBtn = state.rightControlAreas.rightButton;
        const playBtn = state.rightControlAreas.playPause;
        
        if (mouseX > playBtn.x && mouseX < playBtn.x + playBtn.width &&
            mouseY > playBtn.y && mouseY < playBtn.y + playBtn.height) {
            state.isPlaying = !state.isPlaying;
            
            if (state.isPlaying) {
                state.animationTimer = 0;
                state.isPausedBetweenCycles = false;
                
                const years = getEruptionYears();
                if (years.length > 0 && state.timelineYear === null) {
                    state.currentYearIndex = 0;
                    state.timelineYear = years[0];
                }
            }
            return;
        }
        
        if (mouseX > leftBtn.x && mouseX < leftBtn.x + leftBtn.width &&
            mouseY > leftBtn.y && mouseY < leftBtn.y + leftBtn.height) {
            const years = getEruptionYears();
            if (years.length > 0) {
                if (state.currentYearIndex === 0) {
                    state.currentYearIndex = years.length - 1;
                } else {
                    state.currentYearIndex = Math.max(0, state.currentYearIndex - 1);
                }
                state.isPlaying = false;
                updateTimelineYear();
            }
            return;
        }
        
        if (mouseX > rightBtn.x && mouseX < rightBtn.x + rightBtn.width &&
            mouseY > rightBtn.y && mouseY < rightBtn.y + rightBtn.height) {
            const years = getEruptionYears();
            if (years.length > 0) {
                if (state.currentYearIndex === years.length - 1) {
                    state.currentYearIndex = 0;
                } else {
                    state.currentYearIndex = Math.min(years.length - 1, state.currentYearIndex + 1);
                }
                state.isPlaying = false;
                updateTimelineYear();
            }
            return;
        }
    }
}

function applyTemporalFilter() {
    const century = CONFIG.centuries[state.currentCenturiesIndex];
    state.selectedCentury = century.value;
    applyFilters();
    state.isPlaying = false;
}

function updateTimelineYear() {
    const years = getEruptionYears();
    if (years.length > 0) {
        state.timelineYear = years[constrain(state.currentYearIndex, 0, years.length - 1)];
    }
}

// ===== UTILITIES =====
function formatYear(year) {
    return year + (year < 0 ? ' BC' : ' AD');
}

function formatYearShort(year) {
    if (year < 0) {
        return Math.abs(year) + ' BC';
    } else {
        return year + ' AD';
    }
}

function getEruptionYears() {
    return [...new Set(state.filteredData.map(v => v.year))].sort((a, b) => a - b);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    updateLayout();
}