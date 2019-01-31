/**
 * Backend.AI-job-view
 */

import {html, PolymerElement} from '@polymer/polymer';
import '@polymer/polymer/lib/elements/dom-if.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import {setPassiveTouchGestures} from '@polymer/polymer/lib/utils/settings';
import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/paper-styles/typography';
import '@polymer/paper-styles/color';
import '@polymer/paper-material/paper-material';
import '@polymer/iron-collapse/iron-collapse';
import '@polymer/iron-icon/iron-icon';
import '@polymer/iron-icons/iron-icons';
import '@polymer/iron-image/iron-image';
import '@polymer/iron-flex-layout/iron-flex-layout';
import '@polymer/iron-flex-layout/iron-flex-layout-classes';

import '@polymer/paper-dialog/paper-dialog';
import '@polymer/paper-button/paper-button';
import '@polymer/paper-toast/paper-toast';
import '@polymer/paper-toggle-button/paper-toggle-button';
import '@polymer/paper-listbox/paper-listbox';
import '@polymer/paper-checkbox/paper-checkbox';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu';
import '@polymer/paper-slider/paper-slider';
import '@polymer/paper-item/paper-item';
import '@polymer/neon-animation/animations/scale-up-animation.js';
import '@polymer/neon-animation/animations/fade-out-animation.js';

import '@vaadin/vaadin-dialog/vaadin-dialog.js';
import './backend-ai-styles.js';
import './backend-ai-job-list.js';
import './component/backend-ai-dropdown-menu'

import {afterNextRender} from '@polymer/polymer/lib/utils/render-status.js';

//class BackendAIJobView extends OverlayPatchMixin(PolymerElement) {
class BackendAIJobView extends PolymerElement {
  static get is() {
    return 'backend-ai-job-view';
  }

  constructor() {
    super();
    setPassiveTouchGestures(true);
  }

  static get properties() {
    return {
      visible: {
        type: Boolean,
        value: false
      },
      supports: {
        type: Object,
        value: {}
      },
      resourceLimits: {
        type: Object,
        value: {}
      },
      aliases: {
        type: Object,
        value: {
          'TensorFlow': 'lablup/python-tensorflow',
          'Python': 'lablup/python',
          'PyTorch': 'lablup/python-pytorch',
          'Chainer': 'lablup/chainer',
          'R': 'lablup/r',
          'Julia': 'lablup/julia',
          'Lua': 'lablup/lua',
          'DIGITS': 'lablup/ngc-digits',
          'TensorFlow (NGC)': 'lablup/ngc-tensorflow',
          'PyTorch (NGC)': 'lablup/ngc-pytorch',
        }
      },
      versions: {
        type: Array,
        value: ['3.6']
      },
      languages: {
        type: Array,
        value: []
      },
      cpu_metric: {
        type: Object,
        value: {
          'min': '1',
          'max': '1'
        }
      },
      mem_metric: {
        type: Object,
        value: {
          'min': '1',
          'max': '1'
        }
      },
      gpu_metric: {
        type: Object,
        value: {
          'min': '0',
          'max': '0'
        }
      },
      tpu_metric: {
        type: Object,
        value: {
          'min': '1',
          'max': '1'
        }
      },
      images: {
        type: Object,
        value: {}
      }
    }
  }

  ready() {
    super.ready();
    this.$['launch-session'].addEventListener('tap', this._launchSessionDialog.bind(this));
    this.$['launch-button'].addEventListener('tap', this._newSession.bind(this));
    this.$['environment'].addEventListener('selected-item-label-changed', this.updateLanguage.bind(this));
    this.$['version'].addEventListener('selected-item-label-changed', this.updateMetric.bind(this));
    this._initAliases();
    document.addEventListener('backend-ai-connected', () => {
    }, true);
    var gpu_resource = this.$['gpu-resource'];
    this.$['gpu-value'].textContent = gpu_resource.value;
    gpu_resource.addEventListener('value-change', () => {
      this.$['gpu-value'].textContent = gpu_resource.value;
      if (gpu_resource.value > 0) {
        this.$['use-gpu-checkbox'].checked = true;
      } else {
        this.$['use-gpu-checkbox'].checked = false;
      }
    });
    this.$['use-gpu-checkbox'].addEventListener('change', () => {
      if (this.$['use-gpu-checkbox'].checked === true) {
        this.$['gpu-resource'].disabled = false;
      } else {
        this.$['gpu-resource'].disabled = true;
      }
    });
  }

  updateLanguage() {
    this._updateVersions(this.$['environment'].selectedItemLabel);
  }

  _initAliases() {
    for (let item in this.aliases) {
      this.aliases[this.aliases[item]] = item;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    afterNextRender(this, function () {
    });
  }

  static get observers() {
    return [
      '_routeChanged(route.*)',
      '_viewChanged(routeData.view)',
      '_menuChanged(visible)'
    ]
  }

  _routeChanged(changeRecord) {
    if (changeRecord.path === 'path') {
      console.log('Path changed!');
    }
  }

  _viewChanged(view) {
    console.log('View changed!');
    // load data for view
  }

  _menuChanged(visible) {
    if (!visible) {
      this.$['running-jobs'].visible = false;
      this.$['finished-jobs'].visible = false;
      return;
    }
    this.$['running-jobs'].visible = true;
    this.$['finished-jobs'].visible = true;
    // If disconnected
    if (window.backendaiclient == undefined || window.backendaiclient == null) {
      document.addEventListener('backend-ai-connected', () => {
        this._refreshResourceValues();
      }, true);
    } else { // already connected
      this._refreshResourceValues();
    }
  }

  _refreshResourceValues() {
    this._refreshImageList();
    this._updateVirtualFolderList();
    this.updateMetric();
    var cpu_resource = this.$['cpu-resource'];
    this.$['cpu-value'].textContent = cpu_resource.value;
    cpu_resource.addEventListener('value-change', () => {
      this.$['cpu-value'].textContent = cpu_resource.value;
    });
    var ram_resource = this.$['ram-resource'];
    this.$['ram-value'].textContent = ram_resource.value;
    ram_resource.addEventListener('value-change', () => {
      this.$['ram-value'].textContent = ram_resource.value;
    });
    var gpu_resource = this.$['gpu-resource'];
    this.$['gpu-value'].textContent = gpu_resource.value;
  }

  _launchSessionDialog() {
    var gpu_resource = this.$['gpu-resource'];
    this.$['gpu-value'].textContent = gpu_resource.value;
    if (gpu_resource.value > 0) {
      this.$['use-gpu-checkbox'].checked = true;
    } else {
      this.$['use-gpu-checkbox'].checked = false;
    }
    this.$['new-session-dialog'].open();
  }

  _generateKernelIndex(kernel, version) {
    if (kernel in this.aliases) {
      return this.aliases[kernel] + ':' + version;
    }
    return kernel + ':' + version;
  }

  _newSession() {
    let kernel = this.$['environment'].value;
    let version = this.$['version'].value;
    let vfolder = this.$['vfolder'].selectedValues;

    console.log(vfolder);

    let config = {};
    config['cpu'] = this.$['cpu-resource'].value;
    config['gpu'] = this.$['gpu-resource'].value;
    config['mem'] = String(this.$['ram-resource'].value) + 'g';
    if (this.$['use-gpu-checkbox'].checked !== true) {
      config['gpu'] = 0.0;
    }
    if (vfolder.length !== 0) {
      config['mounts'] = vfolder;
    }
    let kernelName = this._generateKernelIndex(kernel, version);
    this.$['launch-button'].disabled = true;
    this.$.notification.text = 'Preparing session...';
    this.$.notification.show();
    window.backendaiclient.createKernel(kernelName, undefined, config).then((req) => {
      this.$['running-jobs'].refreshList();
      this.$['new-session-dialog'].close();
      this.$['launch-button'].disabled = false;
    }).catch(err => {
      console.log(err);
      this.$['launch-button'].disabled = false;
      if (err && err.message) {
        this.$.notification.text = err.message;
        this.$.notification.show();
      }
    });
  }

  _updateEnvironment() {
    //this.languages = Object.keys(this.supports);
    //this.languages.sort();
    let lang = Object.keys(this.supports);
    if (lang == undefined) return;
    lang.sort();
    this.languages = [];
    lang.forEach((item, index) => {
      this.languages.push({
        name: item,
        alias: this.aliases[item]
      });
    });
  }

  _updateVersions(lang) {
    if (this.aliases[lang] in this.supports) {
      this.versions = this.supports[this.aliases[lang]];
      this.versions = this.versions.sort();
    }
    if (this.versions != undefined) {
      this.$.version.value = this.versions[0];
      this.updateMetric();
    }
  }

  _updateVirtualFolderList() {
    let l = window.backendaiclient.vfolder.list();
    l.then((value) => {
      this.vfolders = value;
    });
  }

  _supportLanguages() {
    return Object.keys(this.supports);
  }

  _supportVersions() {
    let lang = this.$['environment'].value;
    return this.supports[lang];
  }

  updateMetric() {
    if (this.$['environment'].value in this.aliases) {
      let currentLang = this.aliases[this.$['environment'].value];
      let currentVersion = this.$['version'].value;
      let kernelName = currentLang + ':' + currentVersion;
      let currentResource = this.resourceLimits[kernelName];
      this.gpu_metric = {};
      currentResource.forEach((item) => {
        if (item.key == 'cpu') {
          this.cpu_metric = item;
          this.cpu_metric.min = parseInt(this.cpu_metric.min);
          this.cpu_metric.max = parseInt(this.cpu_metric.max);
          console.log(this.cpu_metric);
        }
        if (item.key == 'gpu') {
          this.gpu_metric = item;
          this.gpu_metric.min = parseInt(this.gpu_metric.min);
          this.gpu_metric.max = parseInt(this.gpu_metric.max);
          console.log(this.gpu_metric);
        }
        if (item.key == 'tpu') {
          this.tpu_metric = item;
          this.tpu_metric.min = parseInt(this.tpu_metric.min);
          this.tpu_metric.max = parseInt(this.tpu_metric.max);
        }
        if (item.key == 'mem') {
          this.mem_metric = item;
          if (isNaN(item.min) && item.min.substr(-1) === 'm') {
            this.mem_metric.min = parseInt(this.mem_metric.min) / 1024;
          } else {
            this.mem_metric.min = parseInt(this.mem_metric.min);
          }
          if (isNaN(item.max) && item.max.substr(-1) === 'm') {
            this.mem_metric.max = parseInt(this.mem_metric.max) / 1024;
          } else {
            this.mem_metric.max = parseInt(this.mem_metric.max);
          }
          console.log(this.mem_metric);
        }
      });
      console.log(this.cpu_metric);
      if (this.gpu_metric === {}) {
        this.gpu_metric = {
          min: 0,
          max: 0
        };
        this.$['use-gpu-checkbox'].checked = false;
        this.$['gpu-resource'].disabled = true;
        this.$['gpu-resource'].value = 0;
      } else {
        this.$['use-gpu-checkbox'].checked = true;
        this.$['gpu-resource'].disabled = false;
        this.$['gpu-resource'].value = this.gpu_metric.max;
      }
      this.$['gpu-value'].textContent = this.$['gpu-resource'].value;
    }
  }

  updateLanguage() {
    this._updateVersions(this.$['environment'].selectedItemLabel);
  }

  _getResourceLimit(name, metric, minmax) {
    this.resourceLimits[name].forEach((item) => {
      if (item.key === metric) {
        if (metric === 'mem' && item[minmax].substr(-1) === 'g') {
        } else {
          return item[minmax] / 1024;
        }
        return item[minmax];
      }
    });
  }

  _refreshImageList() {
    let fields = ["name", "tag", "digest", "installed", "resource_limits { key min max }"];
    let q, v;
    q = `query {` +
      `  images { ${fields.join(" ")} }` +
      '}';
    v = {};
    window.backendaiclient.gql(q, v).then((response) => {
      console.log(response);
      var images = [];

      Object.keys(response.images).map((objectKey, index) => {
        var item = response.images[objectKey];
        if (item.installed === true) {
          images.push(item);
        }
      });
      if (images.length == 0) {
        return;
      }
      this.images = images;
      this.languages = [];
      this.supports = {};
      Object.keys(this.images).map((objectKey, index) => {
        var item = this.images[objectKey];
        console.log(item);
        if (!(item.name in this.supports)) {
          this.supports[item.name] = [item.tag];
          this.resourceLimits[item.name + ':' + item.tag] = item.resource_limits;
          if (item.name in this.aliases) {
            this.languages.push(this.aliases[item.name]);
          } else {
            this.languages.push(item.name);
          }
          console.log(this.languages);
        } else {
          this.supports[item.name].push(item.tag);
          this.resourceLimits[item.name + ':' + item.tag] = item.resource_limits;
        }
      });
      this._updateEnvironment();
    }).catch(err => {
      if (err && err.message) {
        this.$.notification.text = err.message;
        this.$.notification.show();
      }
    });
  }

  changed(e) {
    console.log(e);
  }

  static get template() {
    // language=HTML
    return html`
      <style is="custom-style" include="backend-ai-styles iron-flex iron-flex-alignment iron-positioning">
        paper-button.launch-button {
          width: 100%;
        }

        paper-material h4 {
          padding: 5px 20px;
          border-bottom: 1px solid #ddd;
          font-weight: 100;
        }

        span.caption {
          width: 30px;
          padding-left: 10px;
        }

        div.caption {
          width: 100px;
        }

        .indicator {
          font-family: monospace;
        }

        backend-ai-dropdown-menu {
          width: 100%;
        }
      </style>
      <paper-toast id="notification" text="" horizontal-align="right"></paper-toast>
      <paper-material class="item" elevation="1">
        <h4 class="horizontal center layout">
          <span>Running</span>
          <paper-button id="launch-session" class="fg red">
            <iron-icon icon="add"></iron-icon>
            Launch
          </paper-button>
        </h4>
        <div>
          <backend-ai-job-list id="running-jobs" condition="running"></backend-ai-job-list>
        </div>
        <h4>Finished</h4>
        <div>
          <backend-ai-job-list id="finished-jobs" condition="finished"></backend-ai-job-list>
        </div>
      </paper-material>
      <paper-dialog id="new-session-dialog" entry-animation="scale-up-animation" exit-animation="fade-out-animation"
                    style="padding:0;">
        <paper-material elevation="1" class="login-panel intro centered" style="margin: 0;">
          <h3 class="horizontal center layout">
            <span>Start a new session</span>
            <div class="flex"></div>
            <paper-icon-button icon="close" class="blue close-button" dialog-dismiss>
              Close
            </paper-icon-button>
          </h3>
          <form id="login-form" onSubmit="this._launchSession()">
            <fieldset>
              <div class="horizontal center layout">
                <paper-dropdown-menu id="environment" label="Environments">
                  <paper-listbox slot="dropdown-content" selected="0">
                    <template is="dom-repeat" items="[[ languages ]]">
                      <paper-item id="[[ item.name ]]" label="[[ item.alias ]]">[[ item.alias ]]</paper-item>
                    </template>
                  </paper-listbox>
                </paper-dropdown-menu>
                <paper-dropdown-menu id="version" label="Version">
                  <paper-listbox slot="dropdown-content" selected="0">
                    <template is="dom-repeat" items="[[ versions ]]">
                      <paper-item id="[[ item ]]" label="[[ item ]]">[[ item ]]</paper-item>
                    </template>
                  </paper-listbox>
                </paper-dropdown-menu>
              </div>
              <div>
                <paper-checkbox id="use-gpu-checkbox">Use GPU</paper-checkbox>
              </div>
              <div class="horizontal center layout">
                <backend-ai-dropdown-menu id="vfolder" multi attr-for-selected="value" label="Virtual folders">
                  <template is="dom-repeat" items="[[ vfolders ]]">
                    <paper-item value$="[[ item.name ]]">[[ item.name ]]</paper-item>
                  </template>
                </backend-ai-dropdown-menu>
              </div>
            </fieldset>
            <h4>Resource allocation</h4>
            <fieldset>
              <div class="horizontal center layout">
                <span>CPU</span>
                <div class="horizontal end-justified layout caption">
                  <span class="indicator" id="cpu-value"></span>
                  <span class="caption">Core</span>
                </div>
                <paper-slider id="cpu-resource" pin snaps expand
                              min="[[ cpu_metric.min ]]" max="[[ cpu_metric.max ]]" value="1"></paper-slider>
              </div>
              <div class="horizontal center layout">
                <span>RAM</span>
                <div class="horizontal end-justified layout caption">
                  <span class="indicator" id="ram-value"></span>
                  <span class="caption">GB</span>
                </div>
                <paper-slider id="ram-resource" pin snaps step=0.1
                              min="[[ mem_metric.min ]]" max="[[ mem_metric.max ]]"
                              value="[[ mem_metric.max ]]"></paper-slider>
              </div>
              <div class="horizontal center layout">
                <span>GPU</span>
                <div class="horizontal end-justified layout caption">
                  <span class="indicator" id="gpu-value"></span>
                  <span class="caption">vGPU</span>
                </div>
                <paper-slider id="gpu-resource" pin snaps step=0.1
                              min="0" max="[[gpu_metric.max]]" value="1"></paper-slider>
              </div>
              <br/>
              <paper-button class="blue launch-button" type="submit" id="launch-button">
                <iron-icon icon="rowing"></iron-icon>
                Launch
              </paper-button>
            </fieldset>
          </form>
        </paper-material>
      </paper-dialog>
    `;
  }
}

customElements.define(BackendAIJobView.is, BackendAIJobView);
