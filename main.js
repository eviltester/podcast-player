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
          //console.log(el.querySelector('description').textContent);
          console.log(el.querySelector('pubDate').textContent);
          this.items.push({
            channelTitle: this.channelTitle,
            channelUrl: this.channelUrl,
            id: String(performance.now()) + String(Math.random() * 16),
            description: el.querySelector('description').textContent,
            descriptionTxt: el
              .querySelector('description')
              .textContent.replace(/(<([^>]+)>)/gi, ''),
            pubDateStr: el.querySelector('pubDate').textContent,
            pubDate: new Date(el.querySelector('pubDate').textContent),
            duration: el.getElementsByTagName('itunes:duration')[0].textContent, // or calculate from enclosure length
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

class EpisodeTooltip {
  init(params) {
    const eGui = (this.eGui = document.createElement('div'));
    const data = params.api.getDisplayedRowAtIndex(params.rowIndex).data;

    eGui.classList.add('custom-tooltip');
    eGui.innerHTML = `
           <p><strong>${data.channelTitle}</strong>
           </p>
           <p>
           ${data.descriptionTxt.substring(1, 300)}
           </p>
       `;
  }

  getGui() {
    return this.eGui;
  }
}

const feed = new FeedReader('https://feed.pod.co/the-evil-tester-show');
var rowData = [];

/*
    Custom Value Formatter to render the date.
*/
function dateFormatter(params) {
  console.log(params.data.pubDate);
  var theDate = params.data.pubDate;
  var dateAsString =
    theDate.getDay() +
    ' / ' +
    theDate.toLocaleString('default', { month: 'long' }) +
    ' / ' +
    theDate.getFullYear();
  return dateAsString;
}

/*
  Allow filtering on data that is in the data setFilter
  but not necessarily rendered in a cell in the table
*/
function onFilterCriteriaChanged() {
  setFilter(document.getElementById('filterdata').value);
}

function setFilter(filterValue) {
  gridOptions.api.setQuickFilter(filterValue);
}

// call this from a getQuickFilterText
function getSearchableText(data) {
  return data.descriptionTxt + ' ' + data.title;
}

/*
  Define the columns to render in the grid
*/
var columnDefs = [
  {
    headerName: 'Title',
    tooltipField: 'title',
    field: 'title',
    wrapText: true,
    autoHeight: true,
    cellRenderer: 'textAsHtml', // render as HTML
    flex: 2,
    resizable: true,
    tooltipComponent: 'episodeTooltip',
    filter: 'agTextColumnFilter', // simple built in text filter
    // override quick filter to enable searching of data,
    // not just the cells
    // https://ag-grid.com/javascript-grid/filter-quick/
    getQuickFilterText: params => {
      return getSearchableText(params.data);
    }
  },
  {
    headerName: 'Published',
    field: 'pubDate', // use the date field, not the string
    valueFormatter: dateFormatter, // use a custom value formatter function for rendering the date
    sortable: true, // allow sorting by date
    filter: 'agDateColumnFilter' // built in date filter
  },
  {
    headerName: 'Episode',
    field: 'mp3',
    flex: 2,
    cellRenderer: 'audioHTMLRenderer' // render as an audio player
  }
];

/*
  Define the grid and rendering options
*/
var gridOptions = {
  // register the custom components for rendering
  components: {
    textAsHtml: TextAsHTMLRenderer,
    audioHTMLRenderer: AudioHTMLRenderer,
    episodeTooltip: EpisodeTooltip
  },
  columnDefs: columnDefs,
  rowData: null, // show loading overlay by default
  tooltipShowDelay: 1, // show tooltips after 1 second
  //tooltipMouseTrack: true, // move tooltip with mouse
  // add pagination to the grid
  pagination: true, // switch pagination on
  paginationPageSize: 10 //max 10 items per page
};

/*
   setup the grid after the page has finished loading
*/
document.addEventListener('DOMContentLoaded', function() {
  var gridDiv = document.querySelector('#myGrid');
  new agGrid.Grid(gridDiv, gridOptions);

  // load the default feed into the grid
  feed.setRowDataWhenReady(gridOptions);
});
