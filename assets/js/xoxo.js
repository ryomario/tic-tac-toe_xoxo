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
    /**
     * 
     * @param {Array} state list of number that indicate the state of one player
     */
    function CheckWinState(state) {
        if(!Array.isArray(state))return console.warn('Check win state error!');

        for (const winstate of WIN_STATES) {
            let win = true;
            for (const num of winstate) {
                if(state.findIndex(n => n == num) === -1)win = false;
            }
            if(win)return true;
        }
        return false;
    }

    window.xOxOGame = xOxOGame;

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


        // constant

        const players = ['x','o'];
        const boardnums = [
            1,2,3,
            4,5,6,
            7,8,9,
        ];
        const maxplayerturnhistory = 3; // helper for game mode 'continually'

        // variables

        var gamemode; // normal, continually

        var currturn; // x, o
        var isrunning; // true, false
        var isdraw; // true, false
        var winner; // null, x, o

        var review_game; // true, false

        // internal use

        var currdialog;
        var statusmap = {};
        const getterstatusmap = {
            'gamemode': (str) => str? str.replace(
                /\w\S*/g,
                function(txt) {
                  return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                }
            ):'-',
            'next-turn': (value) => value? CreateNode('div','xoxo_mark xoxo_mark--'+value):'-',
        }
        
        /**
         * cell_1: 'x'
         * cell_2: 'o'
         */
        var boardmap = {};
        var playersturnshistory = {};

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

        SetNamedStatusBar('gamemode',gamemode,'Game Mode');
        SetNamedStatusBar('next-turn',currturn,'Next Turn');

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
         * @returns get random player 'x' or 'o'
         */
        function GetRandomPlayer() {
            const randid = Math.round(Math.random() * (players.length - 1));
            return players[randid];
        }
        /**
         * 
         * @param {number|string|HTMLElement} mark 'o' or 'x'
         * @param {boolean} isLabel if true, added class _xoxo_cell_label_
         */
        function SetCell(cell, mark, isLabel = true, willbe_deleted = false) {
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
        /**
         * 
         * @param {number} cell cell index in the board
         */
        function GetCellMap(cell) {
            if(typeof cell !== 'number')throw Error('Cell index "'+cell+'" not a number!');

            if(!boardmap)throw Error('Internal error: Board not mapped!');

            const map = boardmap['cell_'+cell];

            return map ?? false;
        }
        function ChangeTurn() {
            let nextidx = 0;
            let curridx = players.findIndex(p => p === currturn);
            
            if(curridx >= 0 && curridx < players.length - 1)nextidx = curridx + 1;

            currturn = players[nextidx];
        }
        function CheckGameState() {
            const players_states = {};
            for (const num of boardnums) {
                for (const player of players) {
                    if(boardmap['cell_'+num] === player){
                        if(!players_states[player])players_states[player] = [];
                        players_states[player].push(num);
                    }
                }
            }

            winner = false;
            for (const player of players) {
                if(players_states[player] && CheckWinState(players_states[player])){
                    winner = player;
                    break;
                }
            }

            if(winner !== false){
                // got win
                isrunning = false;
            } else {
                // check if no more available move
                let available_move = 0;
                for (const num of boardnums) {
                    if(!boardmap['cell_'+num])available_move += 1;
                }

                // no available move, draw
                if(available_move === 0) {
                    isrunning = false;
                    isdraw = true;
                }
            }
        }

        /**
         * 
         * @param {number|string} cell Indicating a cell index for map
         * @param {boolean} updateui Control to update the interface or not
         */
        function MarkCurrentTurn(cell, updateui = true) {
            let cell_num;
            if(typeof cell === 'number') {
                cell_num = cell;
                cell = 'cell_'+cell;
            } else if(typeof cell === 'string') cell_num = Number(cell.replace('cell_',''));

            if(typeof cell !== 'string')return console.warn('Cannot marking cell!');

            if(!isrunning){
                if(updateui){
                    $this.RefreshDOM();
                }

                return console.warn('Game is already ended, start New Game instead!');
            }

            if(boardmap[cell])return console.warn('Cell already marked!');

            // wrap for game mode 'continually'
            if(gamemode == 'continually'){
                // init if null
                if(!playersturnshistory[currturn])playersturnshistory[currturn] = [];

                const removed_turns = [];
                // check if at max history count
                while(playersturnshistory[currturn].length >= maxplayerturnhistory) {
                    removed_turns.push(playersturnshistory[currturn].shift());
                }

                // add to history
                playersturnshistory[currturn].push(cell_num);
                
                // remove mapped mark that removed from history
                for (const num of removed_turns) {
                    boardmap['cell_'+num] = false;
                }
            }

            // mapping the mark
            boardmap[cell] = currturn;

            // change to next turn
            ChangeTurn();

            // check state
            CheckGameState();
            
            // update ui
            if(updateui){
                $this.RefreshDOM();
            }
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
            for (const num of boardnums) {
                if(cell === elems['cell_' + num]){
                    isexist = num;
                    break;
                }
            }
            if(!isexist || isexist === 0)return console.warn('You are not clicked the cell!');

            if(!cell.lastChild)return console.warn('The clicked cell doesn`t have a child!');
            
            if(!cell.lastChild.classList.contains('xoxo_cell_label'))return console.warn('The clicked cell doesn`t have a label!');

            // start action
            MarkCurrentTurn(isexist);
        }
        elems.board.addEventListener('click', HandleCellClick);
        
        function HandleButtonNewGameClick(e) {
            if(!e.isTrusted)return;
            
            $this.NewGameDialog();
        }
        elems.btn_newgame.addEventListener('click', HandleButtonNewGameClick);

        $this.RefreshDOM = function() {
            // refresh status value
            SetNamedStatusBar('gamemode',gamemode,'Game Mode');
            SetNamedStatusBar('next-turn',currturn,'Next Turn');


            boardnums.forEach(num => {
                let mark = currturn;
                let islabel = true;
                if(GetCellMap(num) !== false){
                    mark = GetCellMap(num);
                    islabel = false;
                }

                let willbe_removed = false;
                if(gamemode == 'continually'){
                    if(playersturnshistory[mark] && playersturnshistory[mark].length >= maxplayerturnhistory){
                        willbe_removed = num == playersturnshistory[mark][0];
                    }
                }

                SetCell(num, mark, islabel, willbe_removed);
            });

            if(!isrunning) {
                // diable board event
                parentelem.classList.add('xoxo_gameover');
                elems.board.title = 'Game is already ended!';

                let content = '';

                if(review_game) {
                    content += `<p>Game already ended!</p>`;
                }

                if(!isdraw){
                    content += 'The winner';
                    content += `
                    <div class="xoxo_cell"><div class="xoxo_mark xoxo_mark--${winner}"></div></div>
                    `;
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
        $this.NewGame = function(options = {}) {
            // don't reset current options
            if(!gamemode)gamemode = 'normal';
            if(options && options['gamemode'])gamemode = options['gamemode'];

            isrunning = true;
            isdraw = false;
            winner = null;
            review_game = false;
            currturn = GetRandomPlayer();
            boardmap = {};
            playersturnshistory = {};

            $this.RefreshDOM();
        }
        function CreateOptionInput(option_menus, defaultvalue, onchange) {
            const elem_option = CreateNode('div',['xoxo_option']);
            const elem_option_label = CreateNode('div',['xoxo_option_label']);
            const elem_option_select = CreateNode('div',['xoxo_option_input']);
            elem_option_select.dataset.optid = option_menus.value;
            
            elem_option_label.innerHTML = option_menus.label;
            for (const input_opt of option_menus.inputs) {
                const elem_option_opt = CreateNode('div','xoxo_option_value',{value: input_opt.value},null,input_opt.label);
                if(defaultvalue == input_opt.value)elem_option_opt.classList.add('checked');
                elem_option_select.appendChild(elem_option_opt);
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
            elem_option_select.addEventListener('mousedown',HandleClickOption);
            
            elem_option.appendChild(elem_option_label);
            elem_option.appendChild(elem_option_select);

            return elem_option;
        }
        $this.NewGameDialog = function(cancelable = false, cancel_callback = null) {
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
                }
            };
            const options = {
                'gamemode': gamemode ?? 'normal'
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
            
            elem_contianer_options.addEventListener('input', HandleGameModeOption);

            dialog_newgame.appendChildToMessage(elem_contianer_options);
            dialog_newgame.open();
        }
        
        
        
        $this.NewGameDialog();
    }
})()