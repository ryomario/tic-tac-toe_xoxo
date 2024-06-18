(function(){
    /**
     * 
     * @param {string} tagname HTML Tag Element
     * @param {string|Array} classlist List of class name
     * @param {NamedNodeMap} attributes HTML Attributes
     * @param {CSSStyleDeclaration} styles CSS Styles
     * @param {string} innerText text to be content of element
     */
    function CreateNode(tagname, classes, attributes, styles, innerText) {
        const el = document.createElement(tagname);

        if(classes){
            if(typeof classes == 'string')el.className = classes;
            else el.className = classes.join(' ');
        }
        if(attributes)Object.assign(el,attributes);
        if(styles)Object.assign(el.style, styles);
        if(innerText)el.innerText = innerText;

        return el;
    }
    const WIN_STATES = [
        [1,2,3],[1,4,7],[1,5,9],[2,5,8],[3,6,9],[3,5,7],[4,5,6],[7,8,9]
    ];

    window.xOxOGame = xOxOGame;

    /**
     * 
     * @param {GameState} state old state
     * @returns GameState
     */
    function GameState(state) {
        if(!(this instanceof GameState)) return new GameState(state);
        
        const $this = this;

        $this.turn = "";
        $this.moveCounts = {};
        $this.board = [];
        $this.result = "running";
        $this.turnHistory = {};
        
        $this.Reset = function() {
            $this.turn = "";
            $this.moveCounts = {};
            $this.board = [];
            $this.result = "running";
            $this.turnHistory = {};

            for (let num = 1; num <= 9; num++) {
                $this.board[num] = 'e';
            }
        }
        $this.Reset();

        if(state instanceof GameState) {
            let len = state.board.length;
            $this.board = new Array(len);
            for (let idx = 0; idx < len; idx++) {
                $this.board[idx] = state.board[idx];
            }

            $this.result = state.result;
            $this.turn = state.turn;
            $this.moveCounts = {};
            for (const key in state.moveCounts) {
                $this.moveCounts[key] = state.moveCounts[key];
            }
            $this.turnHistory = {};
            for (const key in state.turnHistory) {
                let hislen = state.turnHistory[key].length;
                $this.turnHistory[key] = new Array(hislen);
                for (let x = 0; x < hislen; x++) {
                    $this.turnHistory[key][x] = state.turnHistory[key][x];
                }
            }
        }

        $this.ChangeTurn = function() {
            $this.turn = $this.turn === 'x' ? 'o' : 'x';
        }

        $this.EmptyCells = function() {
            const indexs = [];
            for (let index = 1; index <= 9; index++) {
                if($this.board[index] === 'e') {
                    indexs.push(index);
                }
            }
            return indexs;
        }
        $this.AddTurnToHistory = function(cell) {
            // init if null
            if(!$this.turnHistory[$this.turn])$this.turnHistory[$this.turn] = [];

            // add to history
            $this.turnHistory[$this.turn].push(cell);
        }

        $this.IsTerminal = function() {
            for (const player of ['o','x']) {
                if($this.turnHistory[player]){
                    for (const winstate of WIN_STATES) {
                        let win = true;
                        for (const num of winstate) {
                            if($this.turnHistory[player].findIndex(n => n == num) === -1)win = false;
                        }
                        if(win) {
                            $this.result = player + '-won';
                            return true;
                        };
                    }
                }
            }

            const available_move = $this.EmptyCells();
            if(available_move.length == 0) {
                $this.result = 'draw';
                return true;
            }
            return false;
        }
    }
    const game_options_available = {
        gamemode: ['normal','continually'],
        gametype: ['vshuman','vsai'],
        aimark: ['x','o'],
    };

    function xOxOGame(containerId, options) {
        if(!(this instanceof xOxOGame)) return new xOxOGame(containerId, options);

        const $this = this;

        if(!containerId)throw Error('parameter "containerId" is required.');
        if(typeof containerId !== 'string')throw Error('parameter "containerId" must be string.');

        const parentelem = document.getElementById(containerId);

        if(!parentelem)throw Error(`Container element with id "${containerId}" not found in DOM.`);

        while(parentelem.firstChild)parentelem.removeChild(parentelem.lastChild);

        parentelem.classList.add('xoxo');

        // merge opts

        var defaults = {
            gamemode: 'normal',
            gametype: 'vsai',
            aimark: 'o',
        };

        $this.settings = Object.assign({}, defaults, options);

        // assert options
        for (const key in $this.settings) {
            if (Object.hasOwnProperty.call(game_options_available, key)) {
                const ava_opts = game_options_available[key];
                if(Array.isArray(ava_opts) && ava_opts.findIndex(avaopt => $this.settings[key] === avaopt) === -1)throw Error(`xOxOGame options '${key}' must be in (${ava_opts.join(', ')})!`);
            }
        }
        if($this.settings.aimark !== 'x' && $this.settings.aimark !== 'o')throw Error('xOxOGame options {aimark} must be "x" or "o"!');
        
        // constant

        const maxplayerturnhistory = 3; // helper for game mode 'continually'
        const aimark = $this.settings.aimark; // helper for game type 'vsai'
        const playermark = ($this.settings.aimark === 'x') ? 'o' : 'x'; // helper for game type 'vsai'

        // variables

        var gamemode = $this.settings.gamemode; // normal, continually
        var gametype = $this.settings.gametype; // vshuman, vsai

        var currstate = new GameState();

        var review_game; // true, false

        // internal use

        var currdialog;

        const options_menus = {
            'gamemode': {
                label: 'Mode',
                inputs: [
                    {
                        label: 'Normal',
                        value: 'normal',
                    },
                    {
                        label: 'Continually',
                        value: 'continually',
                    }
                ]
            },
            'gametype': {
                label: 'Type',
                inputs: [
                    {
                        label: 'Vs. Human',
                        value: 'vshuman',
                    },
                    {
                        label: 'Vs. AI',
                        value: 'vsai',
                    }
                ]
            },
        };
        var statusmap = {};
        const getterstatusmap = {
            'gamemode': (str) => {
                if(!str)return '-';
                const [mode,type] = str.split(',');
                if(!mode)return '-';
                let result = '';
                result += options_menus['gamemode'].inputs.find(i => i.value == mode).label ?? mode;
                if(type){
                    const typestr = options_menus['gametype'].inputs.find(i => i.value == type).label ?? type;
                    result += ' (' + typestr + ')';
                }
                return result;
            },
            'next-turn': (value) => value? ((value == 'x' || value == 'o')?CreateNode('div','xoxo_mark xoxo_mark--'+value):value):'-',
        }

        const elems = {
            title: CreateNode('div',['xoxo_title']),
            topbar: CreateNode('div',['xoxo_topbar']),
            board: CreateNode('div',['xoxo_board']),

            cell_1: CreateNode('div',['xoxo_cell','xoxo_cell--1']),
            cell_2: CreateNode('div',['xoxo_cell','xoxo_cell--2']),
            cell_3: CreateNode('div',['xoxo_cell','xoxo_cell--3']),
            cell_4: CreateNode('div',['xoxo_cell','xoxo_cell--4']),
            cell_5: CreateNode('div',['xoxo_cell','xoxo_cell--5']),
            cell_6: CreateNode('div',['xoxo_cell','xoxo_cell--6']),
            cell_7: CreateNode('div',['xoxo_cell','xoxo_cell--7']),
            cell_8: CreateNode('div',['xoxo_cell','xoxo_cell--8']),
            cell_9: CreateNode('div',['xoxo_cell','xoxo_cell--9']),

            bar: CreateNode('div',['xoxo_bar']),
            btn_newgame: CreateNode('button',['xoxo_btn']),
        };

        elems.title.textContent = 'TIC TAC TOE - XOXO';

        parentelem.appendChild(elems.title);
        parentelem.appendChild(elems.topbar);
        parentelem.appendChild(elems.board);
        parentelem.appendChild(elems.bar);

        elems.board.appendChild(elems.cell_1);
        elems.board.appendChild(elems.cell_2);
        elems.board.appendChild(elems.cell_3);
        elems.board.appendChild(elems.cell_4);
        elems.board.appendChild(elems.cell_5);
        elems.board.appendChild(elems.cell_6);
        elems.board.appendChild(elems.cell_7);
        elems.board.appendChild(elems.cell_8);
        elems.board.appendChild(elems.cell_9);

        elems.btn_newgame.innerText = 'New game';
        elems.bar.appendChild(elems.btn_newgame);

        function SetNamedStatusBar(name, value, label){
            if(!value)value = '';
            if(getterstatusmap[name] && typeof getterstatusmap[name] === 'function')value = getterstatusmap[name](value);

            if(typeof value === 'string' || typeof value === 'number')value = CreateNode('span',null,null,null,value);
            if(!(value instanceof HTMLElement))throw Error('Status bar not HTMLElement');

            if(!label)label = name;

            if(!statusmap[name]){
                const status_el = CreateNode('div','xoxo_status');
                const status_label_el = CreateNode('div','xoxo_status_label');
                const status_value_el = CreateNode('div','xoxo_status_value');
                elems.topbar.appendChild(status_el);
                status_el.appendChild(status_label_el);
                status_el.appendChild(CreateNode('div','xoxo_status_sep',null,null,':'));
                status_el.appendChild(status_value_el);
                status_label_el.innerText = label;

                statusmap[name] = status_value_el;
            } else {
                while(statusmap[name].firstChild)statusmap[name].removeChild(statusmap[name].lastChild);
            }

            statusmap[name].appendChild(value);
        }

        SetNamedStatusBar('gamemode','','Game Mode');
        SetNamedStatusBar('next-turn','','Next Turn');

        /**
         * 
         * @param {string} message Messages to get displayed
         * @param {string} button_text Button label
         * @param {undefined|DefaultDialogCallback} button_callback triggered on click button in dialog, and return boolean to control close dialog or not
         * @param {undefined|()=>{}} cancel_callback triggered on dialog closed
         * @param {boolean} cancelonclickoutside control is dialog closed on click outide dialog, default false
         */
        $this.Dialog = function(message, button_text, button_callback, cancel_callback = null, cancelonclickoutside = false) {
            if(currdialog)currdialog.close(true);
            currdialog = false;

            if(!message)message = 'This is a dialog!';
            if(!button_text)button_text = 'Close';
            if(!button_callback)button_callback = DefaultDialogCallback;


            const dialog = CreateNode('dialog',['xoxo_endgame']);
            const dialog_msg = CreateNode('div',['xoxo_endgame_msg']);
            const dialog_btn = CreateNode('button',['xoxo_btn']);

            dialog.appendChild(dialog_msg);
            dialog.appendChild(dialog_btn);
            dialog_msg.innerHTML = message;
            dialog_btn.innerHTML = button_text;

            function HandleCloseDialog(e) {
                parentelem.removeChild(dialog);
                dialog.removeEventListener('close',HandleCloseDialog);

                console.log('dialog closed');
                if(cancel_callback && typeof cancel_callback === 'function')cancel_callback(dialog);
                currdialog = false;
            }
            dialog.addEventListener('close',HandleCloseDialog);


            var ClickHandle = function(e) {
                if(e.target === dialog_btn) {
                    if(button_callback(dialog)){
                        dialog.removeEventListener('close',HandleCloseDialog);
                        
                        dialog.close();

                        setTimeout(()=>{
                            parentelem.removeChild(dialog);
                        },500);
                        dialog_btn.removeEventListener('click',ClickHandle);
                    }
                } else {
                    let rect = dialog.getBoundingClientRect();
                    let isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
                    if (!isInDialog && cancelonclickoutside) {
                        dialog.close();
                    }
                }
            }

            parentelem.appendChild(dialog);
            dialog.addEventListener('click', ClickHandle);

            currdialog = {
                open: () => {
                    dialog.showModal();
                },
                close: (force = false) => {
                    if(force)dialog.removeEventListener('close',HandleCloseDialog);
                    dialog.close();
                },
                appendChildToMessage: (node) => {
                    if(node && node instanceof HTMLElement)dialog_msg.appendChild(node);
                },
            }

            return currdialog;
        }
        /**
         * 
         * @param {HTMLDialogElement} dialog HTML Dialog
         * @returns true for close the dialog
         */
        var DefaultDialogCallback = function(dialog) {
            console.log('dialog closed');
            return true;
        }
        /**
         * 
         * @param {number|string|HTMLElement} mark 'o' or 'x'
         * @param {boolean} isLabel if true, added class _xoxo_cell_label_
         * @param {boolean} willbe_deleted if true, added class _xoxo_mark_will_deleted_
         */
        function InitCell(cell, mark, isLabel = true, willbe_deleted = false) {
            if(typeof cell === 'number')cell = elems['cell_'+cell];
            else if(typeof cell === 'string')cell = elems[cell];

            if(!cell)return;

            while(cell.firstChild)cell.removeChild(cell.lastChild);
            
            const mark_el = CreateNode('div',['xoxo_mark']);
            if(mark)mark_el.classList.add('xoxo_mark--'+mark);
            if(isLabel)mark_el.classList.add('xoxo_cell_label');
            if(willbe_deleted)mark_el.classList.add('xoxo_mark_will_deleted');

            cell.appendChild(mark_el);
        }

        function HandleCellClick(e) {
            if(!e.isTrusted)return;

            // check if cliked inside board
            let node = e.target;
            while(node && node !== elems.board)node = node.parentNode;
            if(node !== elems.board)return;

            // check if cliked the label
            node = e.target;
            while(node && node.classList && !node.classList.contains('xoxo_cell_label'))node = node.parentNode;
            if(!node.classList || !node.classList.contains('xoxo_cell_label'))return;

            // get the clicked cell
            const cell = e.target.closest('.xoxo_cell');
            // check if clicked cell is exist, do samething for get the cell num
            let isexist = 0;
            for (let num = 1; num <= 9; num++) {
                if(cell === elems['cell_' + num]){
                    isexist = num;
                    break;
                }
            }
            if(!isexist || isexist === 0)return console.warn('You are not clicked the cell!');

            if(!cell.lastChild)return console.warn('The clicked cell doesn`t have a child!');
            
            if(!cell.lastChild.classList.contains('xoxo_cell_label'))return console.warn('The clicked cell doesn`t have a label!');

            // start action
            $this.Movement(isexist);
        }
        elems.board.addEventListener('click', HandleCellClick);
        
        function HandleButtonNewGameClick(e) {
            if(!e.isTrusted)return;
            
            $this.NewGameDialog();
        }
        elems.btn_newgame.addEventListener('click', HandleButtonNewGameClick);

        $this.RefreshDOM = async function() {
            // refresh status value
            SetNamedStatusBar('gamemode',gamemode+','+gametype,'Game Mode');
            if(gametype === 'vsai'){
                SetNamedStatusBar('next-turn',currstate.turn == aimark ? 'AI turn' : 'Your turn','Next Turn');
            } else {
                SetNamedStatusBar('next-turn',currstate.turn,'Next Turn');
            }


            for(let num = 1; num <= 9; num++) {
                let mark = currstate.turn;
                let islabel = true;
                if(GetCellMap(num) !== 'e'){
                    mark = GetCellMap(num);
                    islabel = false;
                }

                let willbe_removed = false;
                if(gamemode == 'continually'){
                    if(currstate.turnHistory[mark] && currstate.turnHistory[mark].length >= maxplayerturnhistory){
                        willbe_removed = num == currstate.turnHistory[mark][0];
                    }
                }

                InitCell(num, mark, islabel, willbe_removed);
            }

            if(currstate.IsTerminal() && currstate.result !== 'running') {
                // diable board event
                parentelem.classList.add('xoxo_gameover');
                elems.board.title = 'Game is already ended!';

                let content = '';

                if(review_game) {
                    content += `<p>Game already ended!</p>`;
                }

                if(currstate.result !== 'draw'){
                    const winner = currstate.result.charAt(0);
                    if(gametype === 'vsai'){
                        if(winner === playermark)content += 'You WIN from AI!!!';
                        else content += 'You LOSE from AI!!!';
                    } else {
                        content += 'The winner';
                        content += `
                        <div class="xoxo_cell"><div class="xoxo_mark xoxo_mark--${winner}"></div></div>
                        `;
                    }
                } else {
                    content += 'Draw!';
                }
                $this.Dialog(content,'New Game', (dialog) => {
                    $this.NewGameDialog();
                    return true;
                },(dialog) => {
                    review_game = true;
                },true).open();
            } else {
                parentelem.classList.remove('xoxo_gameover');
                elems.board.title = '';
            }
        }
        function CreateOptionInput(option_menus, defaultvalue, onchange) {
            const elem_option = CreateNode('div',['xoxo_option']);
            const elem_option_label = CreateNode('div',['xoxo_option_label']);
            const elem_option_select = CreateNode('div',['xoxo_option_input']);
            
            elem_option_label.innerHTML = option_menus.label;
            for (const input_opt of option_menus.inputs) {
                const elem_option_opt = CreateNode('div','xoxo_option_value',{value: input_opt.value},null,input_opt.label);
                if(defaultvalue == input_opt.value)elem_option_opt.classList.add('checked');
                elem_option_select.appendChild(elem_option_opt);

                elem_option_opt.addEventListener('mousedown',HandleClickOption);
            }

            function HandleClickOption(e) {
                if(!e.isTrusted)return;

                let node = e.target;
                while(node && node !== elem_option_select)node = node.parentNode;

                if(node !== elem_option_select)return;

                const val_el = e.target.closest('.xoxo_option_value');
                elem_option_select.querySelectorAll('.xoxo_option_value').forEach(el => el.classList.remove('checked'));
                val_el.classList.add('checked');

                if(elem_option_select.value !== val_el.value){
                    elem_option_select.value = val_el.value;
                    if(onchange)onchange(option_menus.value,val_el.value);
                }
            }
            
            elem_option.appendChild(elem_option_label);
            elem_option.appendChild(elem_option_select);

            return elem_option;
        }
        $this.NewGameDialog = function(cancelable = false, cancel_callback = null) {
            const options = {
                'gamemode': gamemode ?? $this.settings.gamemode,
                'gametype': gametype ?? $this.settings.gametype,
            };
            const dialog_newgame = $this.Dialog('Start New Game!', 'Start', ()=>{
                $this.NewGame(options);
                return true;
            },cancel_callback,cancelable);

            const elem_contianer_options = CreateNode('div',['xoxo_options']);

            for (const value in options_menus) {
                const option_menus = options_menus[value];
                option_menus.value = value;
                const elem_option = CreateOptionInput(option_menus, options[value],HandleGameModeOption);
                elem_contianer_options.appendChild(elem_option);
            }
            
            // Handle game mode option change
            function HandleGameModeOption(opt_name, opt_selected) {
                if(options_menus[opt_name].inputs.findIndex(s => s.value == opt_selected) === -1)throw Error(`Option '${opt_selected}' is not available!`);

                options[opt_name] = opt_selected;
            }

            dialog_newgame.appendChildToMessage(elem_contianer_options);
            dialog_newgame.open();
        }

        // GAME SYSTEM

        $this.NewGame = function(options = {}) {
            // don't reset current options
            if(!gamemode)gamemode = $this.settings.gamemode;
            if(!gametype)gametype = $this.settings.gametype;
            if(options && options['gamemode'])gamemode = options['gamemode'];
            if(options && options['gametype'])gametype = options['gametype'];

            review_game = false;
            
            currstate.Reset();
            currstate.turn = GetRandomPlayer();
            
            if(gametype === 'vsai'){
                if(currstate.turn === aimark){
                    parentelem.classList.add('xoxo_aiturn');
                    AITurn((cell) => {
                        if(cell !== false)$this.Movement(cell, true, true);
                        parentelem.classList.remove('xoxo_aiturn');
                    });
                }
            }

            $this.RefreshDOM();
        }

        /**
         * 
         * @param {number} cell Indicating a cell index for map
         * @param {boolean} updateui Control to update the interface or not
         * @param {boolean} fromai Define if from user action & not the user turn will be prevented
         */
        $this.Movement = function(cell, updateui = true, fromai = false) {
            if(typeof cell !== 'number')throw Error('Cell is not number!');

            if(currstate.IsTerminal()){
                if(updateui){
                    $this.RefreshDOM();
                }

                return console.warn('Game is already ended, start New Game instead!');
            }

            if(currstate.board[cell] !== 'e')return console.warn('Cell already marked!');

            if(gametype === 'vsai' && currstate.turn === aimark && !fromai)return console.warn('Not your turn');

            const nextState = new Action(cell).applyTo(currstate);
            currstate = nextState;
            
            // update ui
            if(updateui){
                $this.RefreshDOM();
            }

            if(gametype === 'vsai'){
                if(currstate.turn === aimark){
                    parentelem.classList.add('xoxo_aiturn');
                    AITurn((cell) => {
                        if(cell !== false)$this.Movement(cell, true, true);
                        parentelem.classList.remove('xoxo_aiturn');
                    });
                }
            }
        }

        /**
         * 
         * @returns get random player 'x' or 'o'
        */
       function GetRandomPlayer() {
            const rand_quality = {};
            rand_quality[playermark] = 1;
            rand_quality[aimark] = 3;
            if(gametype === 'vshuman')rand_quality[aimark] = 1;
            const arr = [];
            for (let idx = 0; idx < rand_quality[playermark]; idx++) {
                arr.push(playermark);
            }
            for (let idx = 0; idx < rand_quality[aimark]; idx++) {
                arr.push(aimark);
            }
            const randid = Math.round(Math.random() * (arr.length - 1));
            return arr[randid];
        }
        /**
         * 
         * @param {number} cell cell index in the board
         */
        function GetCellMap(cell) {
            if(typeof cell !== 'number')throw Error('Cell index "'+cell+'" not a number!');

            if(!currstate.board)throw Error('Internal error: Board not mapped!');

            const map = currstate.board[cell];

            return map;
        }
        
        // AI Helper
        const max_ai_remove_continually = 2; // experimental, 2 is more good for AI than 1
        function Action(pos, isai = false) {
            const $thisact = this;
            $thisact.movePosition = pos;
            $thisact.minimaxVal = 0;
            $thisact.ai = isai;
    
            /**
             * 
             * @param {GameState} state 
             */
            $thisact.applyTo = function(state) {
                const next = new GameState(state);
    
                next.AddTurnToHistory($thisact.movePosition);
                // wrap for game mode 'continually'
                if(gamemode == 'continually' && !(next.moveCounts['ai'] && next.moveCounts['ai'] > max_ai_remove_continually)){
                    const removed_turns = [];
                    // check if at max history count
                    while(next.turnHistory[state.turn].length > maxplayerturnhistory) {
                        removed_turns.push(next.turnHistory[state.turn].shift());
                    }
                    
                    // remove mapped mark that removed from history
                    for (const num of removed_turns) {
                        next.board[num] = 'e';
                    }
                }
                next.board[$thisact.movePosition] = state.turn;
    
                if(!next.moveCounts[state.turn])next.moveCounts[state.turn] = 0;

                next.moveCounts[state.turn] += 1;
                if($thisact.ai && state.turn == aimark){
                    if(!next.moveCounts['ai'])next.moveCounts['ai'] = 0;
                    next.moveCounts['ai'] += 1;
                }

                next.ChangeTurn();

                return next;
            }
        }
        Action.ASCENDING = function(act1, act2) {
            if(act1.minimaxVal < act2.minimaxVal)return -1;
            else if(act1.minimaxVal > act2.minimaxVal)return 1;
            return 0;
        }
        Action.DESCENDING = function(act1, act2) {
            if(act1.minimaxVal > act2.minimaxVal)return -1;
            else if(act1.minimaxVal < act2.minimaxVal)return 1;
            return 0;
        }
        function MinimaxScore(_state) {
            if(_state.result !== 'running') {
                if(_state.result === (playermark+'-won')) {
                    return 10 - _state.moveCounts[aimark];
                }else if(_state.result === (aimark+'-won')) {
                    return -10 + _state.moveCounts[aimark];
                }else return 0;
            }
        }

        function MinimaxValue(state) {
            if(state.IsTerminal()){
                return MinimaxScore(state);
            }else {
                let stateScore;
                if(state.turn === playermark)stateScore = -1000;
                else stateScore = 1000;

                const availablePos = state.EmptyCells();
                const availableNextStates = availablePos.map(pos => {
                    const act = new Action(pos, true);
                    const nextState = act.applyTo(state);
                    return nextState;
                });

                availableNextStates.forEach(nextState => {
                    const nextScore = MinimaxValue(nextState);
                    if(state.turn === playermark){
                        if(nextScore > stateScore)stateScore = nextScore;
                    }else {
                        if(nextScore < stateScore) stateScore = nextScore;
                    }
                });

                return stateScore;
            }
        }
        function AITurn(callback) {
            setTimeout(() => {
                const available = currstate.EmptyCells();

                
                const availableAct = available.map(pos => {
                    const act = new Action(pos);
                    const next = act.applyTo(currstate);
                    act.minimaxVal = MinimaxValue(next);
                    return act;
                });
                
                if(currstate.turn === playermark)availableAct.sort(Action.DESCENDING);
                else availableAct.sort(Action.ASCENDING);
                
                let chosenAct = availableAct[0];
                if(chosenAct){
                    let sameChosenActs = availableAct.filter(act => act.minimaxVal == chosenAct.minimaxVal);
                    
                    const randid = Math.round(Math.random() * (sameChosenActs.length - 1));
                    chosenAct = sameChosenActs[randid];
                }

    
                if(callback)callback(chosenAct?.movePosition ?? false);
            }, 300);
        }
        
        
        $this.NewGameDialog();
    }

})()