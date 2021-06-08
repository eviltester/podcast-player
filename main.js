class FeedReader {
  constructor(rss_url) {
    this.items = [];
    this.channelTitle = '';
    this.channelUrl = '';
    fetch(rss_url)
      .then(response => response.text())
      .then(str => new window.DOMParser().parseFromString(str, 'text/xml'))
      .then(data => {
        //console.log(data);
        const channel = data.querySelector('channel');
        this.channelTitle = channel.querySelector('title').innerHTML;
        this.channelUrl = channel.querySelector('link').innerHTML;

        const itemList = data.querySelectorAll('item');

        itemList.forEach(el => {
          this.items.push({
            channelTitle: this.channelTitle,
            channelUrl: this.channelUrl,
            id: String(performance.now()) + String(Math.random() * 16),
            pubDate: el.querySelector('pubDate'),
            duration: el.getElementsByTagName('itunes:duration')[0], // or calcuate from enclosure length
            title: el.querySelector('title').innerHTML,
            mp3: el.querySelector('enclosure').getAttribute('url'),
            link: el.querySelector('link')?.innerHTML,
            image: el
              .getElementsByTagName('itunes:image')[0]
              ?.getAttribute('href')
          });
        });
        //console.table(this.items);
      });
  }

  getData() {
    return this.items;
  }

  setRowDataWhenReady(gridOptions) {
    if (this.items.length > 0) {
      gridOptions.api.applyTransaction({ add: this.items });
    } else {
      setTimeout(this.setRowDataWhenReady.bind(this), 1000, gridOptions);
    }
  }
}

class AudioHTMLRenderer {
  init(params) {
    // create the cell
    this.eGui = document.createElement('div');
    this.eGui.style.width = '100%';

    var source = params.value;
    this.eGui.innerHTML = `
    <audio controls preload="none">
      <source src="${source}" type="audio/mpeg">
    </audio>
      `;
  }

  getGui() {
    return this.eGui;
  }

  // gets called whenever the cell refreshes
  refresh(params) {
    return true;
  }

  // gets called when the cell is removed from the grid
  destroy() {}
}

class TextAsHTMLRenderer {
  init(params) {
    // create the cell
    //console.log(params);
    this.eGui = document.createElement('div');
    this.eGui.style.wordBreak = 'normal';
    this.eGui.style.lineHeight = 'normal';

    var source = params.value;
    //console.log(source);
    this.eGui.innerHTML = `<p>${source}</p>`;
  }

  getGui() {
    return this.eGui;
  }

  // gets called whenever the cell refreshes
  refresh(params) {
    return true;
  }

  // gets called when the cell is removed from the grid
  destroy() {}
}

const feed = new FeedReader('https://feed.pod.co/the-evil-tester-show');
var rowData = [];

var columnDefs = [
  {
    headerName: 'Title',
    field: 'title',
    wrapText: true,
    autoHeight: true,
    cellRenderer: 'textAsHtml',
    flex: 2,
    resizable: true
  },
  {
    headerName: 'Episode',
    field: 'mp3',
    flex: 2,
    cellRenderer: 'audioHTMLRenderer'
  }
];

var gridOptions = {
  components: {
    textAsHtml: TextAsHTMLRenderer,
    audioHTMLRenderer: AudioHTMLRenderer
  },
  columnDefs: columnDefs,
  rowData: rowData
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function() {
  var gridDiv = document.querySelector('#myGrid');
  new agGrid.Grid(gridDiv, gridOptions);
});

feed.setRowDataWhenReady(gridOptions);
