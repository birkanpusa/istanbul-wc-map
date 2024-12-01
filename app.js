// Harita başlangıç noktası (İstanbul'un merkezi)
const map = L.map('map', {
    center: [41.0082, 28.9784],
    zoom: 15,
    minZoom: 10,
    maxZoom: 18,
    attributionControl: false
});

// OpenStreetMap tile layer ekleme
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: ''
}).addTo(map);

// Global değişkenler
let allMarkers = [];
let geoJsonLayer = null;
let allData = null;

// İlçe filtreleme elementi
const ilceFilter = document.getElementById('ilceFilter');
const resetButton = document.getElementById('resetFilter');

// GeoJSON verilerini yükleme
fetch('data.geojson')
    .then(response => response.json())
    .then(data => {
        allData = data;
        
        // İlçeleri toplama ve filtreye ekleme
        const ilceler = [...new Set(data.features.map(feature => feature.properties.ILCE))].sort();
        
        // Önce mevcut options'ları temizle
        ilceFilter.innerHTML = '<option value="">İlçe Seçin</option>';
        
        // İlçeleri ekle
        ilceler.forEach(ilce => {
            if (ilce) {
                const option = document.createElement('option');
                option.value = ilce;
                option.textContent = ilce;
                ilceFilter.appendChild(option);
            }
        });

        // Tüm verileri göster ve haritayı ortala
        showFilteredData(data);
    })
    .catch(error => {
        console.error('Veri yüklenirken hata oluştu:', error);
    });

// Popup içeriği oluşturma fonksiyonu
function createPopupContent(feature) {
    const status = feature.properties.TUVALET_DURUM === 'Aktif' ? 'Açık' : 
                  feature.properties.TUVALET_DURUM === 'Dönemlik' ? 'Dönemsel' : 'Kapalı';
    const statusClass = feature.properties.TUVALET_DURUM === 'Aktif' ? 'status-open' : 
                       feature.properties.TUVALET_DURUM === 'Dönemlik' ? 'status-seasonal' : 'status-closed';

    return `
        <div class="info-box">
            <h3>${feature.properties.MAHAL_ADI || 'İsimsiz Lokasyon'}</h3>
            <div class="property-row">
                <p><strong>İlçe:</strong> ${feature.properties.ILCE || 'Belirtilmemiş'}</p>
            </div>
            <div class="property-row">
                <p><strong>Durum:</strong> <span class="status ${statusClass}">${status}</span></p>
            </div>
            <div class="property-row">
                <p><strong>Tuvalet Tipi:</strong> ${feature.properties.TUVALET_TIP || 'Belirtilmemiş'}</p>
            </div>
            <div class="property-row">
                <p><strong>Bakım Odası:</strong> ${feature.properties.BAKIM_ODASI || 'Belirtilmemiş'}</p>
            </div>
            <div class="property-row">
                <p><strong>Hizmet Yeri:</strong> ${feature.properties.HIZMET_YERI || 'Belirtilmemiş'}</p>
            </div>
            <button class="directions-btn" onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${feature.geometry.coordinates[1]},${feature.geometry.coordinates[0]}', '_blank')">
                Yol Tarifi Al
            </button>
        </div>
    `;
}

// Verileri filtreleme ve gösterme fonksiyonu
function showFilteredData(data, selectedIlce = '') {
    // Önceki marker'ları temizle
    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
    }
    allMarkers.forEach(marker => map.removeLayer(marker));
    allMarkers = [];

    // Filtrelenmiş verileri hazırla
    const filteredFeatures = selectedIlce
        ? data.features.filter(feature => feature.properties.ILCE === selectedIlce)
        : data.features;

    // GeoJSON layer oluştur
    geoJsonLayer = L.geoJSON({
        type: "FeatureCollection",
        features: filteredFeatures
    }, {
        pointToLayer: function(feature, latlng) {
            const marker = L.marker(latlng);
            marker.bindPopup(createPopupContent(feature));
            allMarkers.push(marker);
            return marker;
        }
    }).addTo(map);

    // Haritayı marker'ların olduğu bölgeye odakla
    if (filteredFeatures.length > 0) {
        const bounds = geoJsonLayer.getBounds();
        const paddingValue = selectedIlce ? 50 : 100; // İlçe seçiliyse daha az padding
        map.fitBounds(bounds, {
            padding: [paddingValue, paddingValue],
            maxZoom: selectedIlce ? 16 : 14 // İlçe seçiliyse daha yakın zoom
        });
    }
}

// İlçe filtresi değiştiğinde
ilceFilter.addEventListener('change', (e) => {
    const selectedIlce = e.target.value;
    showFilteredData(allData, selectedIlce);
});

// Reset butonu tıklandığında
resetButton.addEventListener('click', () => {
    ilceFilter.value = '';
    showFilteredData(allData);
});
