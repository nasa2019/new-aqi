const cities = [
  {
      city: "新北市",
      longitude: 121.6739,
      latitude: 24.91571
  },
  {
      city: "高雄市",
      longitude: 120.666,
      latitude: 23.01087
  },
  {
      city: "臺中市",
      longitude: 120.9417,
      latitude: 24.23321
  },
  {
      city: "臺北市",
      longitude: 121.5598,
      latitude: 25.09108
  },
  {
      city: "桃園縣",
      longitude: 121.2168,
      latitude: 24.93759
  },
  {
      city: "臺南市",
      longitude: 120.2513,
      latitude: 23.1417
  },
  {
      city: "彰化縣",
      longitude: 120.4818,
      latitude: 23.99297
  },
  {
      city: "屏東縣",
      longitude: 120.62,
      latitude: 22.54951
  },
  {
      city: "雲林縣",
      longitude: 120.3897,
      latitude: 23.75585
  },
  {
      city: "苗栗縣",
      longitude: 120.9417,
      latitude: 24.48927
  },
  {
      city: "嘉義縣",
      longitude: 120.574,
      latitude: 23.45889
  },
  {
      city: "新竹縣",
      longitude: 121.1252,
      latitude: 24.70328
  },
  {
      city: "南投縣",
      longitude: 120.9876,
      latitude: 23.83876
  },
  {
      city: "宜蘭縣",
      longitude: 121.7195,
      latitude: 24.69295
  },
  {
      city: "新竹市",
      longitude: 120.9647,
      latitude: 24.80395
  },
  {
      city: "基隆市",
      longitude: 121.7081,
      latitude: 25.10898
  },
  {
      city: "花蓮縣",
      longitude: 121.3542,
      latitude: 23.7569
  },
  {
      city: "嘉義市",
      longitude: 120.4473,
      latitude: 23.47545
  },
  {
      city: "臺東縣",
      longitude: 120.9876,
      latitude: 22.98461
  },
  {
      city: "金門縣",
      longitude: 118.3186,
      latitude: 24.43679
  },
  {
      city: "澎湖縣",
      longitude: 119.6151,
      latitude: 23.56548
  },
  {
      city: "連江縣",
      longitude: 119.5397,
      latitude: 26.19737
  }
];

const layers = ['air', 'disease'];

$(document).ready(function() {
  "use strict";

  /**
   * The Globe encapsulates the WorldWindow object (wwd) and provides application
   * specific logic for interacting with layers.
   * @param {String} canvasId The ID of the canvas element that will host the globe
   * @returns {Globe}
   */
  class Globe {
    constructor(canvasId) {
      // Create a WorldWindow globe on the specified HTML5 canvas
      this.wwd = new WorldWind.WorldWindow(canvasId);

      // Holds the next unique id to be assigned to a layer
      this.nextLayerId = 1;

      // Add a BMNGOneImageLayer background layer. We're overriding the default 
      // minimum altitude of the BMNGOneImageLayer so this layer always available.
      this.addLayer(new WorldWind.BMNGOneImageLayer(), {
        category: "background",
        minActiveAltitude: 0
      });
    }

    /**
     * Adds a layer to the globe. Applies the optional options' properties to the
     * layer, and assigns the layer a unique ID and category.
     * @param {WorldWind.Layer} layer
     * @param {Object|null} options E.g., {category: "base", enabled: true}
     */
    addLayer(layer, options) {
      // Copy all properties defined on the options object to the layer
      if (options) {
        for (let prop in options) {
          if (!options.hasOwnProperty(prop)) {
            continue; // skip inherited props
          }
          layer[prop] = options[prop];
        }
      }
      // Assign a default category property if not already assigned
      if (typeof layer.category === 'undefined') {
        layer.category = 'overlay'; // the default category
      }

      // Assign a unique layer ID to ease layer management 
      layer.uniqueId = this.nextLayerId++;

      // Add the layer to the globe
      this.wwd.addLayer(layer);
    }

    /**
     * Returns a new array of layers in the given category.
     * @param {String} category E.g., "base", "overlay" or "setting".
     * @returns {Array}
     */
    getLayers(category) {
      return this.wwd.layers.filter(layer => layer.category === category);
    }
  }

  // Create a globe
  let globeAir = new Globe("globe-canvas-air");

  // Add layers to the globe 
  globeAir.addLayer(new WorldWind.BMNGLayer(), {
    category: "base"
  });
  globeAir.addLayer(new WorldWind.CoordinatesDisplayLayer(globeAir.wwd), {
    category: "setting"
  });
  // globe.addLayer(new WorldWind.ViewControlsLayer(globe.wwd), {
  //   category: "setting"
  // });
  globeAir.addLayer(new WorldWind.CompassLayer(), {
    category: "setting",
    enabled: false
  });

  layers.forEach((layer, index) => {
    addHeatMap(layer, index === 0);
  });

  globeAir.wwd.goTo(new WorldWind.Location(22, 120));

  // Listen for mouse clicks.
  var clickRecognizer = new WorldWind.ClickRecognizer(
    globeAir.wwd, handleClick
  );


  function addHeatMap(layer, init) {
    let locations = [];
    cities.forEach(city => {
        const point = new WorldWind.MeasuredLocation(
            city.latitude,
            city.longitude,
            Math.ceil(100 * Math.random())
        );
        locations.push(point);
    });

    // Add new HeatMap Layer with the points as the data source.
    let heatMap = new WorldWind.HeatMapLayer(layer, locations);
    heatMap.enabled = init;
    globeAir.wwd.addLayer(heatMap);
  }

  function handleClick(recognizer) {
    // Obtain the event location.
    var x = recognizer.clientX,
        y = recognizer.clientY;

    // Perform the pick. Must first convert from window coordinates to canvas coordinates, which are
    // relative to the upper left corner of the canvas rather than the upper left corner of the page.
    var pickList = globeAir.wwd.pick(globeAir.wwd.canvasCoordinates(x, y));

    // If only one thing is picked and it is the terrain, tell the WorldWindow to go to the picked location.
    if (
        pickList.objects.length === 1 &&
        pickList.objects[0].isTerrain
    ) {
        var position = pickList.objects[0].position;
        globeAir.wwd.goTo(
            new WorldWind.Location(
                position.latitude,
                position.longitude
            )
        );
    }
  }

  // function handleLayer(layer) {
  //     rerender(layer);
  // }

  function rerender(name) {
    for (var i = 0, len = globeAir.wwd.layers.length; i < len; i++) {
        var layer = globeAir.wwd.layers[i];
        if (layer.hide) {
            continue;
        }

        if (layers.indexOf(layer.displayName) !== -1) {
            if (layer.displayName === name) {
                layer.enabled = true;
            }
            else {
                layer.enabled = false;
            }
        }

    }
    globeAir.wwd.redraw();
  }

  // Auto-collapse the main menu when its button items are clicked
  $('.navbar-collapse a[role="button"]').click(function() {
    $('.navbar-collapse').collapse('hide');
  });

  // Collapse card ancestors when the close icon is clicked
  $('.collapse .close').on('click', function() {
    $(this).closest('.collapse').collapse('hide');
  });

  $('button[name="layers"]').on('click', function() {
    rerender($(this).val());
  });
});

