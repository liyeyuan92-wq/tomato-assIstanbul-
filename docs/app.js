const { createApp, ref, computed, watch, onMounted, onUnmounted } = Vue;

createApp({
    data() {
        return {
            // 状态管理
            currentMode: 'pomodoro',
            activeCharacter: null,
            
            // 番茄钟数据
            pomodoroMinutes: 25,
            timeRemaining: 25 * 60,
            isPomodoroRunning: false,
            timerType: 'work', // 'work' 或 'rest'
            pomodoroInterval: null,
            
            // 时间预设
            timePresets: [
                { label: '5分钟', value: 5 },
                { label: '25分钟', value: 25 },
                { label: '45分钟', value: 45 },
                { label: '自定义', value: null }
            ],

            // 角色数据
            characters: [],
            newCharacter: {
                name: '',
                personality: '',
                avatar: null,
                emotions: {},
                chibi: './default/chibi.png'
            },
            showAddCharacterModal: false,
            showAddCustomEmotion: false,
            newCustomEmotionName: '',
            newCustomEmotionSrc: null,

            // 聊天数据
            userInput: '',
            characterDialog: '你好！我是你的学习助手。',
            currentEmotion: '开心',
            affectionLevel: 0,
            showHeartAnimation: false,
            chatHistory: [],
            chatInput: '',

            // 学习模式数据
            studyContent: {
                title: '加载中...',
                chapters: []
            },
            currentChapter: 0,
            aiAnalysis: [],
            isReadingMode: false,
            isTranslationMode: false,
            isMarkdownMode: false,
            markdownContent: '',
            processedMarkdown: '',
            isImporting: false,
            importProgress: 0,
            importCancelled: false,

            // 便签数据
            notes: [],
            editingNoteIndex: -1,

            // 模态框状态

            showMusicModal: false,
            showApiModal: false,
            showDailyCheckIn: false,
            showEditChapterModal: false,
            
            // 编辑章节数据
            editingChapter: {
                index: 0,
                title: '',
                text: ''
            },

            // 音乐数据
            currentMusic: null,
            musicList: [],
            currentMusicIndex: -1,

            // API 配置
            apiConfig: {
                name: localStorage.getItem('api_config_name') || '',
                deepseek_key: localStorage.getItem('deepseek_key') || '',
                deepseek_endpoint: localStorage.getItem('deepseek_endpoint') || 'https://api.deepseek.com/v1'
            },

            // 每日打卡
            dailyCheckIn: {
                streak: parseInt(localStorage.getItem('checkin_streak') || '0'),
                totalCheckIns: parseInt(localStorage.getItem('checkin_total') || '0'),
                checkedInToday: localStorage.getItem('checkin_date') === new Date().toDateString()
            },

            // 学习时长数据
            learningData: JSON.parse(localStorage.getItem('learning_data') || '[]'),
            
            // 通知数据
            notifications: [],
            
            // 聊天记忆数组，用于保留上下文记忆
            memory: []
        };
    },

    computed: {
        formattedTime() {
            return this.formatTime(this.timeRemaining);
        }
    },

    methods: {
        // 初始化应用
        initApp() {
            this.loadDefaultCharacter();
            this.loadLocalData();
            this.playUISound();
        },

        // 加载默认角色
        loadDefaultCharacter() {
            // 如果没有角色，创建一个默认角色
            if (this.characters.length === 0) {
                const defaultChar = {
                    id: Date.now(),
                    name: '小月',
                    personality: '温柔、聪慧的学习助手，喜欢帮助用户学习和解决问题',
                    avatar: './default/normal.png',
                    affection: 50,
                    emotions: {
                        '开心': './default/happy.png',
                        '思考': './default/confused.png',
                        '惊讶': './default/surprised.png',
                        '恼怒': './default/angry.png',
                        '难过': './default/sad.png',
                        '害羞': './default/shy.png',
                        '困惑': './default/confused.png',
                        '兴奋': './default/love.png',
                        '疲惫': './default/sleepy.png',
                        '骄傲': './default/proud.png'
                    },
                    chibi: './default/chibi.png',
                    dialogueLogic: this.getDefaultDialogueLogic()
                };
                
                this.characters.push(defaultChar);
                this.activeCharacter = defaultChar;
            }
        },

        // 生成默认头像（SVG）
        generateDefaultAvatar() {
            return 'data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Ccircle cx="50" cy="50" r="48" fill="%23FFB6D9"/%3E%3Ccircle cx="35" cy="40" r="6" fill="%23000"/%3E%3Ccircle cx="65" cy="40" r="6" fill="%23000"/%3E%3Cpath d="M 40 60 Q 50 70 60 60" stroke="%23000" stroke-width="2" fill="none"/%3E%3C/svg%3E';
        },

        // 生成情感图片（SVG）
        generateEmotionImage(emotion) {
            const emotionConfigs = {
                'happy': { fill: '%23FFB6D9', mouth: 'M 40 60 Q 50 70 60 60' },
                'thinking': { fill: '%23FFC0CB', mouth: 'M 45 65 Q 50 68 55 65' },
                'surprised': { fill: '%23FFB6D9', mouth: 'M 48 60 Q 50 68 52 60' },
                'angry': { fill: '%23FF69B4', mouth: 'M 40 65 Q 50 60 60 65' },
                'sad': { fill: '%23FFB6D9', mouth: 'M 40 70 Q 50 60 60 70' },
                'shy': { fill: '%23FFCCDD', mouth: 'M 45 62 Q 50 65 55 62' },
                'confused': { fill: '%23FFB6D9', mouth: 'M 40 62 Q 50 67 60 62' },
                'excited': { fill: '%23FF69B4', mouth: 'M 38 58 Q 50 72 62 58' },
                'tired': { fill: '%23FFB6D9', mouth: 'M 40 65 Q 50 70 60 65' },
                'proud': { fill: '%23FF69B4', mouth: 'M 40 60 Q 50 68 60 60' }
            };

            const config = emotionConfigs[emotion] || emotionConfigs['happy'];
            
            return `data:image/svg+xml,%3Csvg width="200" height="250" xmlns="http://www.w3.org/2000/svg"%3E%3Ccircle cx="100" cy="80" r="60" fill="${config.fill}"/%3E%3Ccircle cx="75" cy="65" r="8" fill="%23000"/%3E%3Ccircle cx="125" cy="65" r="8" fill="%23000"/%3E%3Cpath d="${config.mouth}" stroke="%23000" stroke-width="2" fill="none"/%3E%3C/svg%3E`;
        },

        // 默认对话逻辑
        getDefaultDialogueLogic() {
            return {
                greeting: ['你好呀！', '嗨，很高兴见到你！', '早上好/下午好！'],
                thinking: ['让我想想...', '这个问题很有趣呢', '让我分析一下'],
                learning: ['好的，我来帮你分析', '这个我知道！', '让我给你讲解一下'],
                affectionActions: {
                    high: '💓 跳起来靠近你',
                    medium: '微笑',
                    low: '点点头'
                }
            };
        },

        // 时间格式化
        formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        },

        // 番茄钟相关方法
        setPomodoroTime(minutes) {
            if (minutes) {
                this.pomodoroMinutes = minutes;
                this.timeRemaining = minutes * 60;
                this.isPomodoroRunning = false;
                this.clearPomodoroInterval();
                this.playUISound();
            }
        },

        togglePomodoro() {
            if (this.isPomodoroRunning) {
                this.pausePomodoro();
            } else {
                this.startPomodoro();
            }
        },

        startPomodoro() {
            this.isPomodoroRunning = true;
            this.playUISound();
            
            this.pomodoroInterval = setInterval(() => {
                this.timeRemaining--;
                
                if (this.timeRemaining <= 0) {
                    this.completePomodoro();
                }
            }, 1000);
        },

        pausePomodoro() {
            this.isPomodoroRunning = false;
            this.clearPomodoroInterval();
            this.playUISound();
        },

        resetPomodoro() {
            this.isPomodoroRunning = false;
            this.clearPomodoroInterval();
            this.timeRemaining = this.pomodoroMinutes * 60;
            this.timerType = 'work';
            this.playUISound();
        },

        completePomodoro() {
            this.clearPomodoroInterval();
            this.playUISound();
            this.playNotificationSound();
            
            if (this.timerType === 'work') {
                this.showNotification('🎉 工作完成！休息一下吧', 'success');
                this.timerType = 'rest';
                this.timeRemaining = 5 * 60;
                this.currentEmotion = '开心';
                this.showHeartAnimation = true;
                setTimeout(() => { this.showHeartAnimation = false; }, 800);
            } else {
                this.showNotification('✨ 休息完毕，继续加油！', 'success');
                this.timerType = 'work';
                this.timeRemaining = this.pomodoroMinutes * 60;
            }
        },

        clearPomodoroInterval() {
            if (this.pomodoroInterval) {
                clearInterval(this.pomodoroInterval);
                this.pomodoroInterval = null;
            }
        },

        // 角色相关方法
        selectCharacter(character) {
            this.activeCharacter = character;
            this.characterDialog = `你好，我是${character.name}！`;
            this.currentEmotion = '开心';
            // 清空记忆数组，因为不同角色的对话上下文是不同的
            this.memory = [];
            this.playUISound();
        },

        createCharacter() {
            if (!this.newCharacter.name.trim()) {
                this.showNotification('请输入角色名称', 'warning');
                return;
            }

            // 确保表情对象不为空，并且包含所有必要的表情
            const defaultEmotions = {
                '开心': './default/happy.png',
                '思考': './default/confused.png',
                '惊讶': './default/surprised.png',
                '恼怒': './default/angry.png',
                '难过': './default/sad.png',
                '害羞': './default/shy.png',
                '困惑': './default/confused.png',
                '兴奋': './default/love.png',
                '疲惫': './default/sleepy.png',
                '骄傲': './default/proud.png'
            };
            
            // 合并默认表情和用户自定义表情
            const finalEmotions = { ...defaultEmotions, ...this.newCharacter.emotions };

            const newChar = {
                id: Date.now(),
                name: this.newCharacter.name,
                personality: this.newCharacter.personality,
                avatar: this.newCharacter.avatar || './default/normal.png',
                affection: 50,
                emotions: finalEmotions,
                customEmotions: this.newCharacter.customEmotions || [],
                tags: this.newCharacter.tags || [],
                chibi: this.newCharacter.chibi || './default/chibi.png',
                dialogueLogic: this.getDefaultDialogueLogic()
            };

            this.characters.push(newChar);
            this.activeCharacter = newChar;
            // 清空记忆数组，因为新角色的对话上下文应该是全新的
            this.memory = [];
            this.showAddCharacterModal = false;
            this.newCharacter = { 
                name: '', 
                personality: '', 
                avatar: null,
                emotions: {},
                customEmotions: [],
                chibi: './default/chibi.png',
                tags: []
            };
            this.newCustomEmotionName = '';
            this.newCustomEmotionSrc = null;
            this.newTag = '';
            this.saveLocalData();
            this.playUISound();
            this.showNotification('角色创建成功！', 'success');
        },

        uploadCharacterAvatar(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.newCharacter.avatar = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        },

        uploadCustomEmotion(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.newCustomEmotionSrc = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        },

        uploadChibiEmotion(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.newCharacter.chibi = e.target.result;
                    this.playUISound();
                    this.showNotification('萌系表情上传成功！', 'success');
                };
                reader.readAsDataURL(file);
            }
        },

        uploadCustomEmotion(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.newCustomEmotionSrc = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        },

        addCustomEmotion() {
            if (!this.newCustomEmotionName.trim()) {
                this.showNotification('请输入表情名称', 'warning');
                return;
            }

            if (!this.newCustomEmotionSrc) {
                this.showNotification('请上传表情图片', 'warning');
                return;
            }

            this.newCharacter.emotions = this.newCharacter.emotions || {};
            this.newCharacter.emotions[this.newCustomEmotionName] = this.newCustomEmotionSrc;
            
            this.newCustomEmotionName = '';
            this.newCustomEmotionSrc = null;
            this.showAddCustomEmotion = false;
            
            this.playUISound();
            this.showNotification('自定义表情添加成功！', 'success');
        },

        removeCustomEmotion(index) {
            if (confirm('确定要删除这个表情吗？')) {
                this.newCharacter.customEmotions.splice(index, 1);
                this.playUISound();
            }
        },

        addTag() {
            if (this.newTag && !this.newCharacter.tags.includes(this.newTag)) {
                this.newCharacter.tags.push(this.newTag);
                this.newTag = '';
                this.playUISound();
            }
        },

        removeTag(index) {
            if (confirm('确定要删除这个标签吗？')) {
                this.newCharacter.tags.splice(index, 1);
                this.playUISound();
            }
        },

        deleteCharacter(id) {
            // 确保至少保留一个角色，初始角色不能删除
            if (this.characters.length <= 1) {
                this.showNotification('至少需要保留一个角色！', 'warning');
                return;
            }
            
            if (confirm('确定要删除这个角色吗？此操作不可恢复。')) {
                const index = this.characters.findIndex(char => char.id === id);
                if (index !== -1) {
                    this.characters.splice(index, 1);
                    if (this.activeCharacter && this.activeCharacter.id === id) {
                        this.activeCharacter = this.characters[0];
                    }
                    this.saveLocalData();
                    this.playUISound();
                    this.showNotification('角色删除成功！', 'success');
                }
            }
        },

        // 聊天方法
        async sendMessage() {
            if (!this.userInput.trim() || !this.activeCharacter) return;

            const userMessage = {
                text: this.userInput,
                sender: 'user',
                timestamp: new Date().toISOString(),
                emotion: this.currentEmotion
            };
            this.chatHistory.push(userMessage);
            this.userInput = '';
            this.playUISound();

            const botResponse = await this.generateBotResponse(userMessage);
            this.chatHistory.push(botResponse);
            this.updateChatHistory();
        },

        // 每日打卡方法
        performDailyCheckIn() {
            if (!this.dailyCheckIn.checkedInToday) {
                // 更新打卡状态
                this.dailyCheckIn.checkedInToday = true;
                this.dailyCheckIn.streak++;
                this.dailyCheckIn.totalCheckIns++;
                
                // 保存到localStorage
                localStorage.setItem('checkin_streak', this.dailyCheckIn.streak.toString());
                localStorage.setItem('checkin_total', this.dailyCheckIn.totalCheckIns.toString());
                localStorage.setItem('checkin_date', new Date().toDateString());
                
                // 播放音效和显示反馈
                this.playUISound();
                this.playNotificationSound();
                
                // 显示成功消息
                this.showNotification('🎉 打卡成功！', 'success');
            }
        },

        // 音效方法
        playUISound() {
            // 这里可以添加UI音效播放逻辑
            console.log('播放UI音效');
        },

        playNotificationSound() {
            // 这里可以添加通知音效播放逻辑
            console.log('播放通知音效');
        },

        // 角色相关方法
        selectCharacter(character) {
            this.activeCharacter = character;
            this.characterDialog = `你好，我是${character.name}！`;
            this.currentEmotion = '开心';
            // 清空记忆数组，因为不同角色的对话上下文是不同的
            this.memory = [];
            this.playUISound();
        },

        createCharacter() {
            if (!this.newCharacter.name.trim()) {
                this.showNotification('请输入角色名称', 'warning');
                return;
            }

            // 创建一个全新的表情对象，只包含用户在本次创建过程中上传的表情
            // 不使用默认表情集合，确保新角色只显示自己有的表情
            const finalEmotions = {};
            
            // 只添加用户在本次创建过程中上传的表情
            if (this.newCharacter.emotions && typeof this.newCharacter.emotions === 'object') {
                Object.keys(this.newCharacter.emotions).forEach(key => {
                    finalEmotions[key] = this.newCharacter.emotions[key];
                });
            }
            
            // 确保至少有基础表情（高兴、失落、平静）
            if (!finalEmotions['开心']) {
                finalEmotions['开心'] = './default/happy.png';
            }
            if (!finalEmotions['难过']) {
                finalEmotions['难过'] = './default/sad.png';
            }
            if (!finalEmotions['思考']) {
                finalEmotions['思考'] = './default/confused.png';
            }

            const newChar = {
                id: Date.now(),
                name: this.newCharacter.name,
                personality: this.newCharacter.personality,
                avatar: this.newCharacter.avatar || './default/normal.png',
                affection: 50,
                emotions: finalEmotions,
                chibi: this.newCharacter.chibi || './default/chibi.png',
                dialogueLogic: this.getDefaultDialogueLogic()
            };

            this.characters.push(newChar);
            this.activeCharacter = newChar;
            // 清空记忆数组，因为新角色的对话上下文应该是全新的
            this.memory = [];
            this.showAddCharacterModal = false;
            // 重置newCharacter对象，确保下次创建角色时不会继承任何之前的表情
            this.newCharacter = { 
                name: '', 
                personality: '', 
                avatar: null,
                emotions: {},
                chibi: './default/chibi.png'
            };
            // 重置自定义表情相关的变量
            this.newCustomEmotionName = '';
            this.newCustomEmotionSrc = null;
            this.showAddCustomEmotion = false;
            this.saveLocalData();
            this.playUISound();
            this.showNotification('角色创建成功！', 'success');
        },

        uploadCharacterAvatar(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.newCharacter.avatar = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        },

        uploadEmotion(emotion, event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.newCharacter.emotions = this.newCharacter.emotions || {};
                    this.newCharacter.emotions[emotion] = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        },

        uploadChibiEmotion(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.newCharacter.chibi = e.target.result;
                    this.playUISound();
                    this.showNotification('萌系表情上传成功！', 'success');
                };
                reader.readAsDataURL(file);
            }
        },

        deleteCharacter(id) {
            // 确保至少保留一个角色，初始角色不能删除
            if (this.characters.length <= 1) {
                this.showNotification('至少需要保留一个角色！', 'warning');
                return;
            }
            
            if (confirm('确定要删除这个角色吗？此操作不可恢复。')) {
                const index = this.characters.findIndex(char => char.id === id);
                if (index !== -1) {
                    this.characters.splice(index, 1);
                    if (this.activeCharacter && this.activeCharacter.id === id) {
                        this.activeCharacter = this.characters[0];
                    }
                    this.saveLocalData();
                    this.playUISound();
                    this.showNotification('角色删除成功！', 'success');
                }
            }
        },

        // 聊天相关方法
        async generateBotResponse(userMessage) {
            try {
                // 检查API配置是否完整
                if (!this.apiConfig.deepseek_key || !this.apiConfig.deepseek_endpoint) {
                    this.showNotification('请先配置API设置！', 'warning');
                    
                    // 使用默认响应作为备选
                    const emotion = this.determineEmotionBasedOnContext(userMessage.text);
                    this.currentEmotion = emotion;
                    this.characterDialog = '我收到了你的消息：' + userMessage.text;
                    
                    return {
                        text: '我收到了你的消息：' + userMessage.text,
                        sender: 'bot',
                        timestamp: new Date().toISOString(),
                        emotion: emotion,
                        suggestions: ['你好！', '今天过得怎么样？', '有什么可以帮助你的吗？']
                    };
                }

                // 检查是否有学习内容和当前章节
                let chapterContext = '';
                if (this.studyContent.chapters && this.studyContent.chapters.length > 0) {
                    const currentChapter = this.studyContent.chapters[this.currentChapter];
                    if (currentChapter) {
                        chapterContext = `\n\n【当前学习章节】\n标题：${currentChapter.title}\n内容：${currentChapter.text}`;
                    }
                }

                // 构建消息数组，包括系统消息、记忆消息和当前消息
                const messages = [
                    {
                        role: 'system',
                        content: `你是${this.activeCharacter.name}，${this.activeCharacter.personality}${chapterContext}\n\n重要要求：\n1. 请根据对话上下文判断你的情绪状态\n2. 如果用户直接要求你展示某个表情，请响应并表现出该表情\n3. 在响应的最后，请用英文方括号[]括起来标注你的情绪状态，例如：[开心]、[难过]、[惊讶]等\n4. 情绪状态应该符合你的性格和当前对话情境`
                    }
                ];

                // 添加记忆中的对话历史
                for (const memoryItem of this.memory) {
                    messages.push({
                        role: memoryItem.role,
                        content: memoryItem.content
                    });
                }

                // 添加当前用户消息
                messages.push({
                    role: 'user',
                    content: userMessage.text
                });

                // 构建API请求参数
                const requestData = {
                    model: 'deepseek-chat',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 500
                };

                // 发送API请求
                const response = await fetch(this.apiConfig.deepseek_endpoint + '/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiConfig.deepseek_key}`
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    let errorMessage = 'API请求失败：' + response.statusText;
                    
                    // 根据HTTP状态码提供更详细的错误信息
                    switch (response.status) {
                        case 401:
                            errorMessage = 'API密钥无效，请检查API密钥是否正确';
                            break;
                        case 403:
                            errorMessage = 'API访问被拒绝，可能是API密钥权限不足';
                            break;
                        case 429:
                            errorMessage = 'API请求频率过高，请稍后再试';
                            break;
                        case 500:
                            errorMessage = 'API服务内部错误，请稍后再试';
                            break;
                        default:
                            errorMessage = 'API请求失败：' + response.statusText;
                    }
                    
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                
                // 检查响应数据格式是否正确
                if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
                    throw new Error('API响应格式错误，无法解析响应内容');
                }
                
                let botText = data.choices[0].message.content;
                
                // 解析API响应中的情绪标注
                let emotion = '开心';
                const emotionMatch = botText.match(/\[(\w+)\]$/);
                if (emotionMatch && emotionMatch[1]) {
                    const apiEmotion = emotionMatch[1];
                    // 移除情绪标注，只保留纯文本内容
                    botText = botText.replace(/\[(\w+)\]$/, '').trim();
                    
                    // 映射API返回的情绪到系统支持的情绪
                    const emotionMap = {
                        '开心': '开心',
                        '快乐': '开心',
                        '高兴': '开心',
                        '难过': '难过',
                        '伤心': '难过',
                        '生气': '恼怒',
                        '愤怒': '恼怒',
                        '惊讶': '惊讶',
                        '震惊': '惊讶',
                        '困惑': '困惑',
                        '迷茫': '困惑',
                        '害羞': '害羞',
                        '不好意思': '害羞',
                        '骄傲': '骄傲',
                        '自豪': '骄傲',
                        '疲惫': '疲惫',
                        '困': '疲惫',
                        '兴奋': '兴奋',
                        '喜欢': '兴奋',
                        '爱': '兴奋'
                    };
                    
                    emotion = emotionMap[apiEmotion] || '开心';
                } else {
                    // 如果API没有标注情绪，使用本地判断
                    emotion = this.determineEmotionBasedOnContext(botText);
                }
                
                // 更新全局表情状态
                this.currentEmotion = emotion;
                this.characterDialog = botText;
                
                // 添加用户消息到记忆数组
                this.memory.push({
                    role: 'user',
                    content: userMessage.text
                });
                
                // 添加机器人响应到记忆数组
                this.memory.push({
                    role: 'assistant',
                    content: botText
                });
                
                // 限制记忆数组的最大长度，避免内存占用过大
                const MAX_MEMORY_LENGTH = 10;
                if (this.memory.length > MAX_MEMORY_LENGTH) {
                    this.memory = this.memory.slice(-MAX_MEMORY_LENGTH);
                }
                
                // 返回API生成的响应
                return {
                    text: botText,
                    sender: 'bot',
                    timestamp: new Date().toISOString(),
                    emotion: emotion,
                    suggestions: ['你好！', '今天过得怎么样？', '有什么可以帮助你的吗？']
                };
            } catch (error) {
                console.error('API调用失败：', error);
                this.showNotification('API调用失败，使用默认响应', 'error');
                
                // 使用默认响应作为备选
                const emotion = this.determineEmotionBasedOnContext(userMessage.text);
                this.currentEmotion = emotion;
                this.characterDialog = '我收到了你的消息：' + userMessage.text;
                
                // 即使API调用失败，也将用户消息添加到记忆数组
                this.memory.push({
                    role: 'user',
                    content: userMessage.text
                });
                
                // 限制记忆数组的最大长度
                const MAX_MEMORY_LENGTH = 10;
                if (this.memory.length > MAX_MEMORY_LENGTH) {
                    this.memory = this.memory.slice(-MAX_MEMORY_LENGTH);
                }
                
                return {
                    text: '我收到了你的消息：' + userMessage.text,
                    sender: 'bot',
                    timestamp: new Date().toISOString(),
                    emotion: emotion,
                    suggestions: ['你好！', '今天过得怎么样？', '有什么可以帮助你的吗？']
                };
            }
        },

        // 根据上下文判断表情（模拟API判断）
        determineEmotionBasedOnContext(text) {
            // 关键词分析
            const happyKeywords = ['开心', '快乐', '高兴', '喜欢', '爱', '好', '棒', '优秀'];
            const sadKeywords = ['难过', '伤心', '哭', '痛苦', '累', '疲惫'];
            const angryKeywords = ['生气', '愤怒', '讨厌', '恨', '烦'];
            const surprisedKeywords = ['惊讶', '震惊', '没想到', '哇', '哦'];
            const confusedKeywords = ['不懂', '不明白', '为什么', '怎么', '困惑'];
            const shyKeywords = ['害羞', '不好意思', '难为情'];
            const proudKeywords = ['骄傲', '自豪', '成功', '胜利'];
            const sleepyKeywords = ['困', '睡觉', '疲惫', '累'];
            const loveKeywords = ['喜欢', '爱', '关心', '在乎'];

            const allText = text.toLowerCase();

            // 优先级判断
            if (happyKeywords.some(keyword => allText.includes(keyword.toLowerCase()))) {
                return '开心';
            } else if (sadKeywords.some(keyword => allText.includes(keyword.toLowerCase()))) {
                return '难过';
            } else if (angryKeywords.some(keyword => allText.includes(keyword.toLowerCase()))) {
                return '恼怒';
            } else if (surprisedKeywords.some(keyword => allText.includes(keyword.toLowerCase()))) {
                return '惊讶';
            } else if (confusedKeywords.some(keyword => allText.includes(keyword.toLowerCase()))) {
                return '困惑';
            } else if (shyKeywords.some(keyword => allText.includes(keyword.toLowerCase()))) {
                return '害羞';
            } else if (proudKeywords.some(keyword => allText.includes(keyword.toLowerCase()))) {
                return '骄傲';
            } else if (sleepyKeywords.some(keyword => allText.includes(keyword.toLowerCase()))) {
                return '疲惫';
            } else if (loveKeywords.some(keyword => allText.includes(keyword.toLowerCase()))) {
                return '兴奋';
            }

            // 默认表情
            return '开心';
        },

        updateChatHistory() {
            // 这里可以添加聊天历史更新逻辑
            console.log('更新聊天历史');
        },

        // 本地数据管理
        saveLocalData() {
            try {
                localStorage.setItem('characters', JSON.stringify(this.characters));
                localStorage.setItem('todoList', JSON.stringify(this.todoList));
                localStorage.setItem('notes', JSON.stringify(this.notes));
                console.log('本地数据保存成功');
            } catch (error) {
                console.error('保存本地数据失败:', error);
            }
        },

        loadLocalData() {
            try {
                const savedCharacters = localStorage.getItem('characters');
                const savedNotes = localStorage.getItem('notes');
                
                if (savedCharacters) {
                    this.characters = JSON.parse(savedCharacters);
                    if (this.characters.length > 0) {
                        this.activeCharacter = this.characters[0];
                    }
                }
                
                if (savedNotes) {
                    this.notes = JSON.parse(savedNotes);
                }
                
                console.log('本地数据加载成功');
            } catch (error) {
                console.error('加载本地数据失败:', error);
            }
        },

        // 学习模式相关方法
        importStudyContent() {
            this.$refs.studyContentInput.click();
        },

        handleStudyContentImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            // 重置导入状态
            this.isImporting = true;
            this.importProgress = 0;
            this.importCancelled = false;

            const reader = new FileReader();
            
            reader.onprogress = (e) => {
                if (e.lengthComputable) {
                    this.importProgress = Math.round((e.loaded / e.total) * 50);
                }
            };

            reader.onload = (e) => {
                if (this.importCancelled) {
                    this.isImporting = false;
                    this.importProgress = 0;
                    return;
                }

                const content = e.target.result;
                const fileName = file.name.replace(/\.[^/.]+$/, '');
                
                // 模拟解析进度
                this.importProgress = 60;
                
                setTimeout(() => {
                    if (this.importCancelled) {
                        this.isImporting = false;
                        this.importProgress = 0;
                        return;
                    }

                    // 根据文件类型处理内容
                    if (file.name.endsWith('.json')) {
                        try {
                            const jsonData = JSON.parse(content);
                            this.studyContent = jsonData;
                        } catch (error) {
                            this.showNotification('JSON文件解析失败，请检查文件格式', 'error');
                            this.isImporting = false;
                            this.importProgress = 0;
                            return;
                        }
                    } else {
                        // 文本文件处理 - 智能解析章节
                        const chapters = this.parseTextContent(content, fileName);
                        this.studyContent = chapters;
                    }
                    
                    this.importProgress = 100;
                    
                    setTimeout(() => {
                        if (this.importCancelled) {
                            this.isImporting = false;
                            this.importProgress = 0;
                            return;
                        }

                        this.currentChapter = 0;
                        this.isImporting = false;
                        this.importProgress = 0;
                        this.playUISound();
                        this.showNotification('内容导入成功！', 'success');
                    }, 200);
                }, 300);
            };

            reader.onerror = () => {
                this.isImporting = false;
                this.importProgress = 0;
                this.showNotification('文件读取失败，请重试', 'error');
            };

            reader.readAsText(file);
        },

        cancelImport() {
            if (confirm('确定要取消导入吗？')) {
                this.importCancelled = true;
                this.isImporting = false;
                this.importProgress = 0;
                this.playUISound();
            }
        },

        parseTextContent(content, fileName) {
            const lines = content.split('\n');
            const chapters = [];
            let currentChapter = null;
            let chapterIndex = 0;
            
            // 章节标题的正则表达式，匹配"第X章"或"第X节"等格式
            const chapterPattern = /^(第[一二三四五六七八九十百千\d]+[章节篇卷部集回])/;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // 跳过空行
                if (!line) continue;
                
                // 检查是否是章节标题
                const chapterMatch = line.match(chapterPattern);
                
                if (chapterMatch) {
                    // 保存上一个章节
                    if (currentChapter) {
                        chapters.push(currentChapter);
                    }
                    
                    // 创建新章节
                    chapterIndex++;
                    currentChapter = {
                        title: chapterMatch[0],
                        text: ''
                    };
                } else if (currentChapter) {
                    // 将内容添加到当前章节
                    if (currentChapter.text) {
                        currentChapter.text += '\n\n' + line;
                    } else {
                        currentChapter.text = line;
                    }
                } else {
                    // 没有章节标题的内容，创建默认章节
                    if (!currentChapter) {
                        chapterIndex++;
                        currentChapter = {
                            title: `第${chapterIndex}章`,
                            text: ''
                        };
                    }
                    
                    if (currentChapter.text) {
                        currentChapter.text += '\n\n' + line;
                    } else {
                        currentChapter.text = line;
                    }
                }
            }
            
            // 添加最后一个章节
            if (currentChapter) {
                chapters.push(currentChapter);
            }
            
            // 如果没有找到任何章节，将整个内容作为一个章节
            if (chapters.length === 0) {
                chapters.push({
                    title: '第一章',
                    text: content.trim()
                });
            }
            
            return {
                title: fileName,
                chapters: chapters
            };
        },

        toggleReadingMode() {
            this.isReadingMode = !this.isReadingMode;
            this.playUISound();
        },

        toggleTranslation() {
            this.isTranslationMode = !this.isTranslationMode;
            if (this.isTranslationMode && this.studyContent.chapters.length > 0) {
                this.translateCurrentChapter();
            }
            this.playUISound();
        },

        async translateCurrentChapter() {
            try {
                // 检查API配置是否完整
                if (!this.apiConfig.deepseek_key || !this.apiConfig.deepseek_endpoint) {
                    this.showNotification('请先配置API设置！', 'warning');
                    return;
                }

                const currentChapter = this.studyContent.chapters[this.currentChapter];
                if (!currentChapter) return;

                // 构建API请求参数
                const requestData = {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个专业的翻译助手，请将输入的中文文本翻译成英文。只返回翻译结果，不要包含任何其他说明或解释。'
                        },
                        {
                            role: 'user',
                            content: `请将以下文本翻译成英文：\n\n${currentChapter.text}`
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 2000
                };

                // 发送API请求
                const response = await fetch(this.apiConfig.deepseek_endpoint + '/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiConfig.deepseek_key}`
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    let errorMessage = 'API请求失败：' + response.statusText;
                    switch (response.status) {
                        case 401:
                            errorMessage = 'API密钥无效，请检查API密钥是否正确';
                            break;
                        case 403:
                            errorMessage = 'API访问被拒绝，可能是API密钥权限不足';
                            break;
                        case 429:
                            errorMessage = 'API请求频率过高，请稍后再试';
                            break;
                        case 500:
                            errorMessage = 'API服务内部错误，请稍后再试';
                            break;
                        default:
                            errorMessage = 'API请求失败：' + response.statusText;
                    }
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
                    throw new Error('API响应格式错误，无法解析响应内容');
                }

                currentChapter.translation = data.choices[0].message.content;
                this.showNotification('翻译成功！', 'success');
            } catch (error) {
                console.error('翻译失败：', error);
                this.showNotification('翻译失败：' + error.message, 'error');
            }
        },

        toggleMarkdownMode() {
            this.isMarkdownMode = !this.isMarkdownMode;
            this.playUISound();
        },

        async processMarkdown() {
            if (!this.markdownContent.trim()) {
                this.showNotification('请输入MARKDOWN内容！', 'warning');
                return;
            }

            try {
                // 检查API配置是否完整
                if (!this.apiConfig.deepseek_key || !this.apiConfig.deepseek_endpoint) {
                    this.showNotification('请先配置API设置！', 'warning');
                    
                    // 使用默认处理作为备选
                    this.processedMarkdown = this.simulateMarkdownProcessing(this.markdownContent);
                    this.playUISound();
                    return;
                }

                // 构建API请求参数
                const requestData = {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个MARKDOWN处理器，请将输入的MARKDOWN内容转换为HTML格式。只返回HTML内容，不要包含任何其他说明或解释。'
                        },
                        {
                            role: 'user',
                            content: `请将以下MARKDOWN内容转换为HTML格式：\n\n${this.markdownContent}`
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 2000
                };

                // 发送API请求
                const response = await fetch(this.apiConfig.deepseek_endpoint + '/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiConfig.deepseek_key}`
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    let errorMessage = 'API请求失败：' + response.statusText;
                    
                    // 根据HTTP状态码提供更详细的错误信息
                    switch (response.status) {
                        case 401:
                            errorMessage = 'API密钥无效，请检查API密钥是否正确';
                            break;
                        case 403:
                            errorMessage = 'API访问被拒绝，可能是API密钥权限不足';
                            break;
                        case 429:
                            errorMessage = 'API请求频率过高，请稍后再试';
                            break;
                        case 500:
                            errorMessage = 'API服务内部错误，请稍后再试';
                            break;
                        default:
                            errorMessage = 'API请求失败：' + response.statusText;
                    }
                    
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                
                // 检查响应数据格式是否正确
                if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
                    throw new Error('API响应格式错误，无法解析响应内容');
                }
                
                this.processedMarkdown = data.choices[0].message.content;
                this.playUISound();
                this.showNotification('MARKDOWN处理成功！', 'success');
            } catch (error) {
                console.error('API调用失败：', error);
                this.showNotification('API调用失败，使用默认处理', 'error');
                
                // 使用默认处理作为备选
                this.processedMarkdown = this.simulateMarkdownProcessing(this.markdownContent);
                this.playUISound();
            }
        },

        // 模拟MARKDOWN处理（使用简单的正则表达式转换）
        simulateMarkdownProcessing(markdown) {
            // 标题处理
            let html = markdown
                // 标题
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
                .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
                .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
                // 粗体和斜体
                .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*)\*/g, '<em>$1</em>')
                .replace(/__(.*)__/g, '<strong>$1</strong>')
                .replace(/_(.*)_/g, '<em>$1</em>')
                // 无序列表
                .replace(/^- (.*$)/gm, '<li>$1</li>')
                .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
                // 有序列表
                .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
                .replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>')
                // 链接
                .replace(/\[(.*)\]\((.*)\)/g, '<a href="$2" target="_blank">$1</a>')
                // 图片
                .replace(/!\[(.*)\]\((.*)\)/g, '<img src="$2" alt="$1">')
                // 代码块
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                // 行内代码
                .replace(/`(.*?)`/g, '<code>$1</code>')
                // 引用
                .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
                // 水平线
                .replace(/^---$/gm, '<hr>')
                // 段落
                .replace(/^(?!<h[1-6]>)(?!<ul>)(?!<ol>)(?!<li>)(?!<pre>)(?!<blockquote>)(?!<hr>)(.*$)/gm, '<p>$1</p>');
            
            return html;
        },

        // 通知相关方法
        showNotification(message, type = 'info') {
            this.notifications.push({ message, type });
            // 3秒后自动移除通知
            setTimeout(() => {
                this.removeNotification(this.notifications.length - 1);
            }, 3000);
        },

        removeNotification(index) {
            if (index >= 0 && index < this.notifications.length) {
                this.notifications.splice(index, 1);
            }
        },

        manualEditContent() {
            if (!this.studyContent.chapters || this.studyContent.chapters.length === 0) {
                this.showNotification('没有可编辑的章节内容！', 'warning');
                return;
            }
            this.showEditChapterModal = true;
            this.editingChapter = {
                index: this.currentChapter,
                title: this.studyContent.chapters[this.currentChapter].title,
                text: this.studyContent.chapters[this.currentChapter].text
            };
        },
        
        saveChapterEdit() {
            if (!this.editingChapter.title.trim()) {
                this.showNotification('章节标题不能为空！', 'warning');
                return;
            }
            
            this.studyContent.chapters[this.editingChapter.index].title = this.editingChapter.title;
            this.studyContent.chapters[this.editingChapter.index].text = this.editingChapter.text;
            this.saveLocalData();
            this.showEditChapterModal = false;
            this.playUISound();
            this.showNotification('章节编辑成功！', 'success');
        },

        previousChapter() {
            if (this.currentChapter > 0) {
                this.currentChapter--;
                if (this.isTranslationMode) {
                    this.translateCurrentChapter();
                }
                this.playUISound();
            }
        },

        nextChapter() {
            if (this.currentChapter < this.studyContent.chapters.length - 1) {
                this.currentChapter++;
                if (this.isTranslationMode) {
                    this.translateCurrentChapter();
                }
                this.playUISound();
            }
        },

        goToChapter(index) {
            const chapterIndex = parseInt(index);
            if (chapterIndex >= 0 && chapterIndex < this.studyContent.chapters.length) {
                this.currentChapter = chapterIndex;
                if (this.isTranslationMode) {
                    this.translateCurrentChapter();
                }
                this.playUISound();
            }
        },

        getMergedChapters() {
            if (!this.studyContent.chapters || this.studyContent.chapters.length === 0) {
                return [];
            }

            const merged = [];
            const chapterMap = new Map();

            this.studyContent.chapters.forEach((chapter, index) => {
                const title = chapter.title;
                // 检查是否是"第X章"格式
                const chapterMatch = title.match(/^第[一二三四五六七八九十百千\d]+章$/);
                if (chapterMatch) {
                    if (chapterMap.has(title)) {
                        chapterMap.get(title).push(index);
                    } else {
                        chapterMap.set(title, [index]);
                    }
                } else {
                    merged.push({ title, indices: [index] });
                }
            });

            // 转换Map为数组
            chapterMap.forEach((indices, title) => {
                merged.push({ title, indices });
            });

            return merged;
        },

        async analyzeCurrentChapter() {
            try {
                // 检查是否有当前章节内容
                if (!this.studyContent.chapters || this.studyContent.chapters.length === 0) {
                    this.showNotification('没有可分析的章节内容！', 'warning');
                    return;
                }

                // 获取当前章节内容
                const currentChapter = this.studyContent.chapters[this.currentChapter];
                if (!currentChapter) {
                    this.showNotification('当前章节不存在！', 'warning');
                    return;
                }

                // 检查API配置是否完整
                if (!this.apiConfig.deepseek_key || !this.apiConfig.deepseek_endpoint) {
                    this.showNotification('请先配置API设置！', 'warning');
                    
                    // 使用默认分析作为备选
                    this.aiAnalysis = [
                        {
                            title: '默认分析',
                            content: '这是一个默认的章节分析结果。',
                            type: 'info'
                        }
                    ];
                    this.playUISound();
                    return;
                }

                // 构建API请求参数
                const requestData = {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个AI吐槽助手，擅长对文章章节进行有趣的分析和吐槽。请根据输入的章节内容，生成有趣、有见解的吐槽和分析。'
                        },
                        {
                            role: 'user',
                            content: `请分析以下章节内容并生成有趣的吐槽：\n\n章节标题：${currentChapter.title}\n\n章节内容：${currentChapter.text}`
                        }
                    ],
                    temperature: 0.8,
                    max_tokens: 1000
                };

                // 发送API请求
                const response = await fetch(this.apiConfig.deepseek_endpoint + '/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiConfig.deepseek_key}`
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    let errorMessage = 'API请求失败：' + response.statusText;
                    
                    // 根据HTTP状态码提供更详细的错误信息
                    switch (response.status) {
                        case 401:
                            errorMessage = 'API密钥无效，请检查API密钥是否正确';
                            break;
                        case 403:
                            errorMessage = 'API访问被拒绝，可能是API密钥权限不足';
                            break;
                        case 429:
                            errorMessage = 'API请求频率过高，请稍后再试';
                            break;
                        case 500:
                            errorMessage = 'API服务内部错误，请稍后再试';
                            break;
                        default:
                            errorMessage = 'API请求失败：' + response.statusText;
                    }
                    
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                
                // 检查响应数据格式是否正确
                if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
                    throw new Error('API响应格式错误，无法解析响应内容');
                }
                
                const analysisContent = data.choices[0].message.content;
                
                // 解析分析结果，生成多个分析项
                this.aiAnalysis = [
                    {
                        title: 'AI吐槽',
                        content: analysisContent,
                        type: 'info'
                    }
                ];
                
                this.playUISound();
                this.showNotification('章节分析完成！', 'success');
            } catch (error) {
                console.error('API调用失败：', error);
                this.showNotification('API调用失败，使用默认分析', 'error');
                
                // 使用默认分析作为备选
                this.aiAnalysis = [
                    {
                        title: '默认分析',
                        content: 'API调用失败，无法生成分析结果。',
                        type: 'error'
                    }
                ];
                this.playUISound();
            }
        },

        // 便签相关方法
        addNote() {
            this.notes.push('新便签');
            this.editingNoteIndex = this.notes.length - 1;
            this.saveLocalData();
            this.playUISound();
        },

        deleteNote(index) {
            if (confirm('确定要删除这个便签吗？')) {
                this.notes.splice(index, 1);
                this.saveLocalData();
                this.playUISound();
            }
        },

        // 音乐相关方法
        importMusic() {
            this.$refs.musicInput.click();
        },

        handleMusicImport(event) {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                reader.onload = (e) => {
                    const musicItem = {
                        id: Date.now() + i,
                        name: file.name,
                        src: e.target.result
                    };
                    this.musicList.push(musicItem);
                    
                    // 如果是第一首音乐，自动播放
                    if (this.currentMusicIndex === -1) {
                        this.currentMusicIndex = 0;
                        this.currentMusic = musicItem.src;
                    }
                    this.playUISound();
                    this.showNotification('音乐导入成功！', 'success');
                };
                reader.readAsDataURL(file);
            }
        },

        playMusic(index) {
            if (index >= 0 && index < this.musicList.length) {
                this.currentMusicIndex = index;
                this.currentMusic = this.musicList[index].src;
                this.playUISound();
            }
        },

        removeMusic(index) {
            if (confirm('确定要删除这首音乐吗？')) {
                this.musicList.splice(index, 1);
                if (index === this.currentMusicIndex) {
                    if (this.musicList.length > 0) {
                        this.currentMusicIndex = Math.max(0, this.currentMusicIndex - 1);
                        this.currentMusic = this.musicList[this.currentMusicIndex].src;
                    } else {
                        this.currentMusicIndex = -1;
                        this.currentMusic = null;
                    }
                } else if (index < this.currentMusicIndex) {
                    this.currentMusicIndex--;
                }
                this.playUISound();
                this.showNotification('音乐删除成功！', 'success');
            }
        },

        nextMusic() {
            if (this.musicList.length > 0) {
                this.currentMusicIndex = (this.currentMusicIndex + 1) % this.musicList.length;
                this.currentMusic = this.musicList[this.currentMusicIndex].src;
                this.playUISound();
            }
        },

        prevMusic() {
            if (this.musicList.length > 0) {
                this.currentMusicIndex = (this.currentMusicIndex - 1 + this.musicList.length) % this.musicList.length;
                this.currentMusic = this.musicList[this.currentMusicIndex].src;
                this.playUISound();
            }
        },

        // API配置相关方法
        saveApiConfig() {
            localStorage.setItem('api_config_name', this.apiConfig.name);
            localStorage.setItem('deepseek_key', this.apiConfig.deepseek_key);
            localStorage.setItem('deepseek_endpoint', this.apiConfig.deepseek_endpoint);
            this.showApiModal = false;
            this.playUISound();
            this.showNotification('API配置已保存！', 'success');
        },

        // 测试API连接
        async testApiConnection() {
            // 检查API配置是否完整
            if (!this.apiConfig.deepseek_key || !this.apiConfig.deepseek_endpoint) {
                this.showNotification('请填写完整的API配置！', 'warning');
                return;
            }

            try {
                // 构建API请求参数
                const requestData = {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个API测试助手，只需要返回"API测试成功"即可。'
                        },
                        {
                            role: 'user',
                            content: '测试API连接'
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 50
                };

                // 发送API请求
                const response = await fetch(this.apiConfig.deepseek_endpoint + '/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiConfig.deepseek_key}`
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    let errorMessage = 'API请求失败：' + response.statusText;
                    
                    // 根据HTTP状态码提供更详细的错误信息
                    switch (response.status) {
                        case 401:
                            errorMessage = 'API密钥无效，请检查API密钥是否正确';
                            break;
                        case 403:
                            errorMessage = 'API访问被拒绝，可能是API密钥权限不足';
                            break;
                        case 429:
                            errorMessage = 'API请求频率过高，请稍后再试';
                            break;
                        case 500:
                            errorMessage = 'API服务内部错误，请稍后再试';
                            break;
                        default:
                            errorMessage = 'API请求失败：' + response.statusText;
                    }
                    
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                
                // 检查响应数据格式是否正确
                if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
                    throw new Error('API响应格式错误，无法解析响应内容');
                }
                this.playNotificationSound();
                this.showNotification('API测试成功！\n配置名称：' + this.apiConfig.name + '\nAPI端点：' + this.apiConfig.deepseek_endpoint, 'success');
            } catch (error) {
                console.error('API测试失败：', error);
                this.playNotificationSound();
                this.showNotification('API测试失败：' + error.message, 'error');
            }
        },

        // 每日打卡相关方法
        performDailyCheckIn() {
            const today = new Date().toDateString();
            
            if (!this.dailyCheckIn.checkedInToday) {
                // 更新打卡数据
                this.dailyCheckIn.streak++;
                this.dailyCheckIn.totalCheckIns++;
                this.dailyCheckIn.checkedInToday = true;
                
                // 保存到localStorage
                localStorage.setItem('checkin_streak', this.dailyCheckIn.streak);
                localStorage.setItem('checkin_total', this.dailyCheckIn.totalCheckIns);
                localStorage.setItem('checkin_date', today);
                
                // 生成随机学习时长（实际应用中应该从计时器获取）
                const studyDuration = Math.floor(Math.random() * 180) + 30; // 30-210分钟
                
                // 保存学习时长数据
                this.learningData.push({
                    date: today,
                    duration: studyDuration
                });
                
                // 只保留最近30天的数据
                if (this.learningData.length > 30) {
                    this.learningData = this.learningData.slice(-30);
                }
                
                localStorage.setItem('learning_data', JSON.stringify(this.learningData));
                
                this.playNotificationSound();
                this.showNotification('每日打卡成功！\n连续打卡：' + this.dailyCheckIn.streak + '天\n今日学习时长：' + studyDuration + '分钟', 'success');
                
                // 重新绘制学习时长折线图
                this.$nextTick(() => {
                    this.drawLearningChart();
                });
            } else {
                this.showNotification('今日已经打卡过了！', 'info');
            }
        },

        // 绘制学习时长折线图
        drawLearningChart() {
            const canvas = this.$refs.learningChart;
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            // 清空画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (this.learningData.length === 0) {
                ctx.fillStyle = '#666';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('暂无学习时长数据', canvas.width / 2, canvas.height / 2);
                return;
            }
            
            // 设置图表参数
            const padding = 40;
            const chartWidth = canvas.width - padding * 2;
            const chartHeight = canvas.height - padding * 2;
            
            // 计算数据范围
            const maxDuration = Math.max(...this.learningData.map(item => item.duration), 60);
            
            // 绘制坐标轴
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1;
            
            // X轴
            ctx.beginPath();
            ctx.moveTo(padding, canvas.height - padding);
            ctx.lineTo(canvas.width - padding, canvas.height - padding);
            ctx.stroke();
            
            // Y轴
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, canvas.height - padding);
            ctx.stroke();
            
            // 绘制数据点和线条
            ctx.strokeStyle = '#4a90e2';
            ctx.lineWidth = 2;
            ctx.fillStyle = '#4a90e2';
            
            ctx.beginPath();
            
            this.learningData.forEach((item, index) => {
                const x = padding + (index / (this.learningData.length - 1)) * chartWidth;
                const y = canvas.height - padding - (item.duration / maxDuration) * chartHeight;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                // 绘制数据点
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // 绘制日期标签
                ctx.fillStyle = '#666';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(item.date.substring(4), x, canvas.height - padding + 15);
                
                // 绘制时长标签
                ctx.fillStyle = '#4a90e2';
                ctx.font = '10px Arial';
                ctx.fillText(item.duration + '分钟', x, y - 10);
            });
            
            ctx.stroke();
            
            // 绘制Y轴刻度
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            
            for (let i = 0; i <= 5; i++) {
                const y = canvas.height - padding - (i / 5) * chartHeight;
                const value = Math.round((i / 5) * maxDuration);
                
                ctx.beginPath();
                ctx.moveTo(padding - 5, y);
                ctx.lineTo(padding, y);
                ctx.stroke();
                
                ctx.fillText(value + '分钟', padding - 10, y + 4);
            }
        }
    },

    // 生命周期钩子
    mounted() {
        this.initApp();
    },

    watch: {
        // 当学习数据变化时重新绘制图表
        learningData() {
            this.$nextTick(() => {
                this.drawLearningChart();
            });
        },
        
        // 当每日打卡模态框显示时绘制图表
        showDailyCheckIn(val) {
            if (val) {
                this.$nextTick(() => {
                    this.drawLearningChart();
                });
            }
        }
    }

}).mount('#app');