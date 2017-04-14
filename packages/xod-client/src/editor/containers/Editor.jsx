import R from 'ramda';
import React from 'react';
import $ from 'sanctuary-def';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HotKeys } from 'react-hotkeys';

import * as Actions from '../actions';
import * as ProjectActions from '../../project/actions';
import * as ProjectSelectors from '../../project/selectors';
import * as EditorSelectors from '../selectors';

import { COMMAND } from '../../utils/constants';
import { EDITOR_MODE } from '../../editor/constants';

import Patch from './Patch';
import ProjectBrowser from '../../projectBrowser/containers/ProjectBrowser';
import Sidebar from '../../utils/components/Sidebar';
import Workarea from '../../utils/components/Workarea';

import { RenderableSelection } from '../../project/types';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

import Tabs from '../containers/Tabs';
import Inspector from '../components/Inspector';

class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.onPropUpdate = this.onPropUpdate.bind(this);
    this.onPinModeSwitch = this.onPinModeSwitch.bind(this);
    this.setModeCreating = this.setModeCreating.bind(this);
    this.setModeDefault = this.setModeDefault.bind(this);
    this.getHotkeyHandlers = this.getHotkeyHandlers.bind(this);

    this.patchSize = this.props.size;
  }

  onPropUpdate(nodeId, propKind, propKey, propValue) {
    this.props.actions.updateNodeProperty(nodeId, propKind, propKey, propValue);
  }

  onPinModeSwitch(nodeId, pinKey, injected, val) {
    this.props.actions.changePinMode(nodeId, pinKey, injected, val);
  }

  setEditorMode(mode) {
    this.props.actions.setMode(mode);
  }

  setModeCreating() {
    this.setEditorMode(EDITOR_MODE.CREATING_NODE);
  }

  setModeDefault() {
    this.setEditorMode(EDITOR_MODE.DEFAULT);
  }

  getHotkeyHandlers() {
    return {
      [COMMAND.SET_MODE_DEFAULT]: this.setModeDefault,
      [COMMAND.UNDO]: () => this.props.actions.undo(this.props.currentPatchPath),
      [COMMAND.REDO]: () => this.props.actions.redo(this.props.currentPatchPath),
    };
  }

  render() {
    const {
      propsForInspector,
      currentPatchPath,
      selection,
    } = this.props;

    const currentPatch = currentPatchPath
      ? (
        <Patch
          patchPath={currentPatchPath}
          size={this.patchSize}
          setModeCreating={this.setModeCreating}
        />
      )
      : ( // TODO: some kind of welcome screen
        <p>no open patch</p>
      );

    return (
      <HotKeys handlers={this.getHotkeyHandlers()} className="Editor">
        <Sidebar>
          <ProjectBrowser />
          <Inspector
            data={propsForInspector}
            selection={selection}
            onPropUpdate={this.onPropUpdate}
            onPinModeSwitch={this.onPinModeSwitch}
          />
        </Sidebar>
        <Workarea>
          <Tabs />
          {currentPatch}
        </Workarea>
      </HotKeys>
    );
  }
}

Editor.propTypes = {
  size: React.PropTypes.object.isRequired,
  propsForInspector: React.PropTypes.arrayOf(React.PropTypes.object),
  selection: sanctuaryPropType($.Array(RenderableSelection)),
  currentPatchPath: React.PropTypes.string,
  actions: React.PropTypes.objectOf(React.PropTypes.func),
};

const mapStateToProps = R.applySpec({
  propsForInspector: ProjectSelectors.dataForInspectorFromSelection,
  selection: ProjectSelectors.getRenderableSelection,
  currentPatchPath: EditorSelectors.getCurrentPatchPath,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    updateNodeProperty: ProjectActions.updateNodeProperty,
    changePinMode: ProjectActions.changePinMode,
    undo: ProjectActions.undoPatch,
    redo: ProjectActions.redoPatch,

    setMode: Actions.setMode,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Editor);
