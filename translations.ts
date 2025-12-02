// Translation Dictionary for PixelLite Pro
export type Language = 'zh' | 'en';

export interface TranslationKeys {
    title: string;
    hero_title_prefix: string;
    slogans: string[];
    hero_desc: string;
    upload_area: string;
    formats: string;
    image_info: string;
    original_size: string;
    compressed_size: string;
    savings: string;
    compression_strength: string;
    enhance_strength: string;
    slider_tip: string;
    processing: string;
    save_history: string;
    saved_history: string;
    change_image: string;
    download_only: string;
    ai_analysis_title: string;
    ai_analysis_placeholder: string;
    start_analysis: string;
    analyzing: string;
    history_title: string;
    settings_title: string;
    language_label: string;
    api_key_label: string;
    api_key_placeholder: string;
    api_key_placeholder_env: string;
    api_key_desc: string;
    smart_compression: string;
    smart_compression_desc: string;
    default_quality: string;
    save_settings: string;
    data_manager: string;
    privacy_warning_title: string;
    privacy_warning_desc: string;
    select_all: string;
    selected_items: string;
    include_original: string;
    export_zip: string;
    delete: string;
    confirm_delete_title: string;
    confirm_delete_desc: string;
    cancel: string;
    confirm: string;
    no_history: string;
    generate_ai: string;
    original_label: string;
    compressed_label: string;
    custom_key_active: string;
    delete_record: string;
    export_failed: string;
    tags_label: string;
    drag_compare: string;
    compressing: string;
    webdav_missing_url: string;
    settings_tab_general: string;
    settings_tab_modes: string;
    settings_tab_webdav: string;
    settings: string;
    mode_label: string;
    api_base_url: string;
    api_base_url_desc: string;
    webdav_help: string;
    webdav_server_url: string;
    webdav_username: string;
    webdav_password: string;
    test_connection: string;
    connection_success: string;
    connection_failed: string;
    backup_btn: string;
    restore_btn: string;
    backup_success: string;
    restore_success: string;
    enhance_mode: string;
    enhance_mode_title: string;
    enhance_mode_desc: string;
    default_process_mode: string;
    mode_compress: string;
    mode_enhance: string;
    switch_to_compress: string;
    switch_to_enhance: string;
    enhance_method: string;
    method_algorithm: string;
    method_ai: string;
    ai_model_name: string;
    default_ai_prompt: string;
    ai_enhance_prompt_label: string;
    btn_generate: string;
    generating: string;
    ai_enhance_placeholder: string;
    responding: string;
    backup_tag_label: string;
    enter_backup_tag: string;
    uploading: string;
    manage_restore_btn: string;
    or_local: string;
    save_to_disk: string;
    load_from_disk: string;
    backup_downloaded: string;
    local_backup_failed: string;
    confirm_restore_local: string;
    restore_success_count: string;
    restore_handler_missing: string;
    invalid_backup_file: string;
    backup_error_prefix: string;
    editor_title: string;
    editor_save: string;
    editor_reset: string;
    editor_rotate_left: string;
    editor_rotate_right: string;
    editor_flip_h: string;
    editor_flip_v: string;
    editor_pen: string;
    editor_eraser: string;
    editor_color: string;
    editor_size: string;
    editor_crop: string;
    editor_adjust: string;
    editor_draw: string;
    editor_apply: string;
    editor_cancel: string;
    editor_brightness: string;
    editor_contrast: string;
    editor_saturation: string;
    editor_filter_none: string;
    editor_filter_grayscale: string;
    editor_filter_sepia: string;
    editor_filter_invert: string;
    editor_filter_blur: string;
    editor_crop_tip: string;
    edit_view: string;

    // RestoreModal
    restore_modal_title: string;
    refresh_list: string;
    select_all_backups: string;
    backups_selected: string;
    download_zip_btn: string;
    batch_delete_btn: string;
    restore_backup_btn: string;
    fetching_backups: string;
    no_backups_found: string;
    confirm_restore_backup: string;
    confirm_restore_settings: string;
    btn_restore_images: string;
    btn_restore_settings: string;
    btn_restore_all: string;
    restored_items_count: string;
    restore_backup_failed: string;
    confirm_batch_delete_backups: string;
    batch_delete_backups_failed: string;
    batch_download_backups_failed: string;

    // Compression engine and output format
    compression_engine: string;
    engine_canvas: string;
    engine_canvas_desc: string;
    engine_algorithm: string;
    engine_algorithm_desc: string;
    output_format: string;
    output_format_card_title: string;
    current_format: string;
    format_original: string;
    format_webp: string;
    format_png: string;
    format_jpeg: string;
    format_note_canvas: string;
    format_note_ai: string;
    format_will_be: string;

    [key: string]: any;
}

export const translations: Record<Language, TranslationKeys> = {
    zh: {
        title: 'PixelLite Pro',
        hero_title_prefix: '智能',
        slogans: ['图片压缩', '画质增强', '无损优化'],
        hero_desc: '一站式图片处理工坊。压缩体积，增强画质,智能分析。数据本地处理，安全无忧。',
        upload_area: '点击上传，拖拽，或 Ctrl+V 粘贴图片',
        formats: '支持 PNG, JPG, JPEG, WebP',
        image_info: '图片信息',
        original_size: '原始大小',
        compressed_size: '处理后',
        savings: '变化',
        compression_strength: '压缩强度',
        enhance_strength: '清晰度增强',
        slider_tip: '调整滑块以平衡效果',
        processing: '正在处理...',
        save_history: '确认并保存',
        saved_history: '已保存',
        change_image: '换一张',
        download_only: '仅下载',
        ai_analysis_title: 'AI 智能分析与建议',
        ai_analysis_placeholder: '使用 Gemini 模型分析图片内容，获取优化建议。',
        start_analysis: '开始分析',
        analyzing: '分析中...',
        history_title: '历史记录',
        settings_title: '设置',
        language_label: '语言 / Language',
        api_key_label: 'Gemini API Key',
        api_key_placeholder: '输入您的 API Key',
        api_key_placeholder_env: '使用内置默认 Key',
        api_key_desc: '留空则尝试使用系统环境变量中的 Key (如果存在)。',
        smart_compression: '智能压缩',
        smart_compression_desc: '根据图片大小自动推荐最佳压缩率',
        default_quality: '默认强度',
        save_settings: '保存设置',
        data_manager: '数据管理',
        privacy_warning_title: '隐私与数据安全提醒',
        privacy_warning_desc: '所有转换记录和图片仅保存在您的浏览器缓存(内存)中。刷新页面或关闭标签页后，所有数据将永久丢失。请及时导出重要文件。',
        select_all: '全选',
        selected_items: '已选 {count} 项',
        include_original: '包含原图',
        export_zip: '导出 ZIP',
        delete: '删除',
        confirm_delete_title: '确认删除?',
        confirm_delete_desc: '您即将删除 {count} 个项目。此操作无法撤销。',
        cancel: '取消',
        confirm: '确认',
        no_history: '暂无历史记录',
        generate_ai: 'AI 分析',
        original_label: '原图',
        compressed_label: '处理后',
        custom_key_active: 'Custom Key Active',
        delete_record: '删除记录',
        export_failed: '导出失败，请重试',
        tags_label: '标签',
        drag_compare: '拖动中间滑块对比效果',
        compressing: '处理中...',
        webdav_missing_url: '请先配置 WebDAV URL',
        settings_tab_general: '通用设置',
        settings_tab_modes: '处理模式',
        settings_tab_webdav: 'WebDAV 备份',
        settings: '设置',
        mode_label: '压缩引擎',
        api_base_url: 'API Base URL',
        api_base_url_desc: '可选：覆盖默认 Google API 地址 (如使用反向代理)。',
        webdav_help: '支持 WebDAV 协议的网盘 (如坚果云, Nextcloud, Alist)',
        webdav_server_url: '服务器地址 (Server URL)',
        webdav_username: '用户名 (Username)',
        webdav_password: '密码 (Password)',
        test_connection: '测试连接',
        connection_success: '连接成功！',
        connection_failed: '连接失败',
        backup_btn: '备份',
        restore_btn: '恢复',
        backup_success: '备份成功！',
        restore_success: '恢复成功！',
        enhance_mode: '清晰增强',
        enhance_mode_title: '画质增强设置',
        enhance_mode_desc: '通过图像卷积算法增强边缘清晰度和对比度。',
        default_process_mode: '默认处理模式',
        mode_compress: '压缩模式',
        mode_enhance: '增强模式',
        switch_to_compress: '切换到压缩模式',
        switch_to_enhance: '切换到增强模式',
        enhance_method: '增强方式',
        method_algorithm: '传统算法 (本地快)',
        method_ai: 'AI 生成 (云端慢)',
        ai_model_name: 'AI 模型名称',
        default_ai_prompt: '默认提示词模板',
        ai_enhance_prompt_label: 'AI 增强提示词',
        btn_generate: '开始生成',
        generating: '生成中...',
        ai_enhance_placeholder: '等待生成...',
        responding: '已生成图片',
        backup_tag_label: '备份标签 / 名称',
        enter_backup_tag: '请输入备份标签',
        uploading: '上传中...',
        manage_restore_btn: '管理 / 恢复',
        or_local: '或 本地操作',
        save_to_disk: '保存到本地',
        load_from_disk: '从本地加载',
        backup_downloaded: '备份已下载',
        local_backup_failed: '本地备份失败: ',
        confirm_restore_local: '从 {filename} 恢复？当前历史记录将被合并。',
        restore_success_count: '成功恢复 {count} 个项目',
        restore_handler_missing: '恢复处理器未连接',
        invalid_backup_file: '无效的备份文件: ',
        backup_error_prefix: '备份错误: ',
        editor_title: '图片编辑器',
        editor_save: '保存修改',
        editor_reset: '重置',
        editor_rotate_left: '向左旋转',
        editor_rotate_right: '向右旋转',
        editor_flip_h: '水平翻转',
        editor_flip_v: '垂直翻转',
        editor_pen: '画笔',
        editor_eraser: '橡皮擦',
        editor_color: '颜色',
        editor_size: '粗细',
        editor_crop: '裁剪',
        editor_adjust: '调整',
        editor_draw: '涂鸦',
        editor_apply: '应用',
        editor_cancel: '取消',
        editor_brightness: '亮度',
        editor_contrast: '对比度',
        editor_saturation: '饱和度',
        editor_filter_none: '原图',
        editor_filter_grayscale: '黑白',
        editor_filter_sepia: '复古',
        editor_filter_invert: '反色',
        editor_filter_blur: '模糊',
        editor_crop_tip: '拖动调整裁剪区域',
        edit_view: '编辑 / 查看',

        // Compression engine and output format
        compression_engine: '压缩引擎',
        engine_canvas: '极速模式 (Canvas)',
        engine_canvas_desc: 'WebP 格式，快速压缩',
        engine_algorithm: '专业模式 (Algorithm)',
        engine_algorithm_desc: '支持 PNG 有损压缩，多格式导出',
        output_format: '导出格式',
        output_format_card_title: '输出格式设置',
        current_format: '当前格式',
        format_original: '保持原格式',
        format_webp: 'WebP',
        format_png: 'PNG',
        format_jpeg: 'JPEG',
        format_note_canvas: '注意：极速模式仅支持 WebP 输出',
        format_note_ai: 'AI图片输出格式为Base64转码',
        format_will_be: '输出将为',

        restore_modal_title: '备份管理',
        refresh_list: '刷新列表',
        select_all_backups: '全选',
        backups_selected: '已选 {count} 个',
        download_zip_btn: 'ZIP',
        batch_delete_btn: '删除',
        restore_backup_btn: '恢复',
        fetching_backups: '获取备份列表中...',
        no_backups_found: '未找到备份文件',
        confirm_restore_backup: '确认从 {filename} 恢复？',
        confirm_restore_settings: '检测到备份包含设置信息，请选择恢复方式：',
        btn_restore_images: '仅恢复图片',
        btn_restore_settings: '仅恢复设置',
        btn_restore_all: '恢复所有',
        restored_items_count: '成功恢复 {count} 个项目',
        restore_backup_failed: '恢复失败',
        confirm_batch_delete_backups: '确认删除 {count} 个备份？',
        batch_delete_backups_failed: '批量删除失败',
        batch_download_backups_failed: '批量下载失败',
    },
    en: {
        title: 'PixelLite Pro',
        hero_title_prefix: 'Smart ',
        slogans: ['Compression', 'Enhancement', 'Optimization'],
        hero_desc: 'All-in-one image studio. Reduce size, enhance clarity, and analyze with AI. Secure local processing.',
        upload_area: 'Click to upload, Drag & Drop, or Ctrl+V',
        formats: 'Supports PNG, JPG, JPEG, WebP',
        image_info: 'Image Info',
        original_size: 'Original Size',
        compressed_size: 'Processed',
        savings: 'Change',
        compression_strength: 'Compression',
        enhance_strength: 'Sharpening',
        slider_tip: 'Adjust slider to balance effect',
        processing: 'Processing...',
        save_history: 'Confirm & Save',
        saved_history: 'Saved',
        change_image: 'Change Image',
        download_only: 'Download Only',
        ai_analysis_title: 'AI Analysis & Advice',
        ai_analysis_placeholder: 'Use Gemini model to analyze content and get optimization advice.',
        start_analysis: 'Analyze',
        analyzing: 'Analyzing...',
        history_title: 'History',
        settings_title: 'Settings',
        language_label: 'Language',
        api_key_label: 'Gemini API Key',
        api_key_placeholder: 'Enter your API Key',
        api_key_placeholder_env: 'Using built-in default Key',
        api_key_desc: 'Leave empty to use system environment variable Key (if exists).',
        smart_compression: 'Smart Compression',
        smart_compression_desc: 'Auto-recommend best compression rate based on file size',
        default_quality: 'Default Strength',
        save_settings: 'Save Settings',
        data_manager: 'Data Manager',
        privacy_warning_title: 'Privacy & Data Safety',
        privacy_warning_desc: 'All records and images are stored in browser memory only. Data will be lost upon refresh or closing tab. Please export important files.',
        select_all: 'Select All',
        selected_items: 'Selected {count}',
        include_original: 'Include Originals',
        export_zip: 'Export ZIP',
        delete: 'Delete',
        confirm_delete_title: 'Confirm Delete?',
        confirm_delete_desc: 'You are about to delete {count} items. This cannot be undone.',
        cancel: 'Cancel',
        confirm: 'Confirm',
        no_history: 'No history records',
        generate_ai: 'AI Analyze',
        original_label: 'Original',
        compressed_label: 'Processed',
        custom_key_active: 'Custom Key Active',
        delete_record: 'Delete Record',
        export_failed: 'Export failed, please try again',
        tags_label: 'Tags',
        drag_compare: 'Drag slider to compare',
        compressing: 'Working...',
        webdav_missing_url: 'Please configure WebDAV URL first',
        settings_tab_general: 'General',
        settings_tab_modes: 'Modes',
        settings_tab_webdav: 'WebDAV Backup',
        settings: 'Settings',
        mode_label: 'Compression Engine',
        api_base_url: 'API Base URL',
        api_base_url_desc: 'Optional: Override default Google API endpoint (e.g. for proxies).',
        webdav_help: 'Supports WebDAV compatible services (Nextcloud, etc.)',
        webdav_server_url: 'Server URL',
        webdav_username: 'Username',
        webdav_password: 'Password',
        test_connection: 'Test Connection',
        connection_success: 'Connected!',
        connection_failed: 'Connection Failed',
        backup_btn: 'Backup',
        restore_btn: 'Restore',
        backup_success: 'Backup Successful!',
        restore_success: 'Restore Successful!',
        enhance_mode: 'Enhancement',
        enhance_mode_title: 'Enhancement Settings',
        enhance_mode_desc: 'Uses image convolution algorithms to improve edge clarity and contrast.',
        default_process_mode: 'Default Mode',
        mode_compress: 'Compression',
        mode_enhance: 'Enhancement',
        switch_to_compress: 'Switch to Compress',
        switch_to_enhance: 'Switch to Enhance',
        enhance_method: 'Enhance Method',
        method_algorithm: 'Algorithm (Fast, Local)',
        method_ai: 'AI Generation (Slow, Cloud)',
        ai_model_name: 'AI Model Name',
        default_ai_prompt: 'Default Prompt Template',
        ai_enhance_prompt_label: 'AI Enhance Prompt',
        btn_generate: 'Generate',
        generating: 'Generating...',
        ai_enhance_placeholder: 'Waiting for generation...',
        responding: 'Already Generated',
        backup_tag_label: 'Backup Tag / Name',
        enter_backup_tag: 'Please enter a backup tag',
        uploading: 'Uploading...',
        manage_restore_btn: 'Manage / Restore',
        or_local: 'OR LOCAL',
        save_to_disk: 'Save to Disk',
        load_from_disk: 'Load from Disk',
        backup_downloaded: 'Backup downloaded successfully',
        local_backup_failed: 'Local backup failed: ',
        confirm_restore_local: 'Restore from {filename}? Current history will be merged.',
        restore_success_count: 'Restored {count} items successfully',
        restore_handler_missing: 'Restore handler not connected',
        invalid_backup_file: 'Invalid backup file: ',
        backup_error_prefix: 'Backup Error: ',
        editor_title: 'Image Editor',
        editor_save: 'Save Changes',
        editor_reset: 'Reset',
        editor_rotate_left: 'Rotate Left',
        editor_rotate_right: 'Rotate Right',
        editor_flip_h: 'Flip Horizontal',
        editor_flip_v: 'Flip Vertical',
        editor_pen: 'Pen',
        editor_eraser: 'Eraser',
        editor_color: 'Color',
        editor_size: 'Size',
        editor_crop: 'Crop',
        editor_adjust: 'Adjust',
        editor_draw: 'Draw',
        editor_apply: 'Apply',
        editor_cancel: 'Cancel',
        editor_brightness: 'Brightness',
        editor_contrast: 'Contrast',
        editor_saturation: 'Saturation',
        editor_filter_none: 'Normal',
        editor_filter_grayscale: 'Grayscale',
        editor_filter_sepia: 'Sepia',
        editor_filter_invert: 'Invert',
        editor_filter_blur: 'Blur',
        editor_crop_tip: 'Drag the overlay to crop',
        edit_view: 'Edit / View',

        // Compression engine and output format
        compression_engine: 'Compression Engine',
        engine_canvas: 'Fast Mode (Canvas)',
        engine_canvas_desc: 'WebP format, quick compression',
        engine_algorithm: 'Professional (Algorithm)',
        engine_algorithm_desc: 'Lossy PNG, multi-format export',
        output_format: 'Export Format',
        output_format_card_title: 'Output Format Settings',
        current_format: 'Current Format',
        format_original: 'Keep Original',
        format_webp: 'WebP',
        format_png: 'PNG',
        format_jpeg: 'JPEG',
        format_note_canvas: 'Note: Fast Mode only supports WebP output',
        format_note_ai: 'AI images is transfered from Base64',
        format_will_be: 'Output will be',

        restore_modal_title: 'Backup Manager',
        refresh_list: 'Refresh',
        select_all_backups: 'Select All',
        backups_selected: '{count} selected',
        download_zip_btn: 'ZIP',
        batch_delete_btn: 'Delete',
        restore_backup_btn: 'Restore',
        fetching_backups: 'Fetching backups...',
        no_backups_found: 'No backups found',
        confirm_restore_backup: 'Restore from {filename}?',
        confirm_restore_settings: 'Backup contains settings. Choose restore mode:',
        btn_restore_images: 'Images Only',
        btn_restore_settings: 'Settings Only',
        btn_restore_all: 'Restore All',
        restored_items_count: 'Restored {count} items',
        restore_backup_failed: 'Restore failed',
        confirm_batch_delete_backups: 'Delete {count} backups?',
        batch_delete_backups_failed: 'Batch delete failed',
        batch_download_backups_failed: 'Batch download failed',
    }
};
