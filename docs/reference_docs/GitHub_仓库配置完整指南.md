# GitHub仓库配置完整指南 (团队合作，大厂规范版本)

## 1. 仓库权限设置

### 1.1 添加/移除协作者

#### 操作步骤
1. 登录GitHub账户，进入目标仓库页面
2. 点击页面右上角的 `Settings` 选项卡
3. 在左侧导航栏中选择 `Collaborators and teams`
4. 在 `Collaborators` 部分，点击 `Add people` 按钮
5. 在弹出的对话框中，输入协作者的GitHub用户名、邮箱或全名
6. 从搜索结果中选择正确的协作者
7. 在权限级别下拉菜单中选择合适的权限（Read、Write、Admin）
8. 点击 `Add {用户名} to this repository` 按钮

#### 预期界面描述
- 协作者添加后，会显示在 `Collaborators` 列表中，包含用户名、权限级别和添加时间
- 每个协作者条目右侧有 `Change role` 和 `Remove` 按钮

#### 注意事项
- 确保输入正确的GitHub用户名，避免添加错误用户
- 权限级别应根据协作者的职责合理分配，遵循最小权限原则
- 添加协作者后，系统会自动发送邀请邮件，协作者需要接受邀请才能获得访问权限

### 1.2 分配不同权限级别

#### 权限级别说明
| 权限级别 | 允许操作 |
|---------|----------|
| **Read** | 查看仓库内容、克隆仓库、创建Issue和Pull Request |
| **Write** | 除Read权限外，还可以推送代码、管理Issue和Pull Request、创建分支 |
| **Admin** | 除Write权限外，还可以管理仓库设置、添加/移除协作者、更改权限级别 |

#### 更改协作者权限
1. 在 `Collaborators and teams` 页面中，找到目标协作者
2. 点击 `Change role` 按钮
3. 从下拉菜单中选择新的权限级别
4. 点击 `Save` 按钮

#### 预期界面描述
- 协作者的权限级别会立即更新
- 界面会显示权限变更的提示信息

### 1.3 管理组织成员访问权限

#### 操作步骤
1. 在 `Collaborators and teams` 页面中，切换到 `Teams` 标签
2. 点击 `Add team` 按钮
3. 从下拉菜单中选择组织中的团队
4. 在权限级别下拉菜单中选择合适的权限
5. 点击 `Add team` 按钮

#### 预期界面描述
- 团队添加后，会显示在 `Teams` 列表中，包含团队名称、权限级别和添加时间
- 每个团队条目右侧有 `Change role` 和 `Remove` 按钮

#### 注意事项
- 只有仓库所在组织的成员才能通过团队方式访问仓库
- 团队权限会覆盖个人权限，遵循权限叠加原则
- 当团队成员离开组织时，会自动失去该仓库的访问权限

## 2. 分支保护规则配置

### 2.1 启用分支保护

#### 操作步骤
1. 进入仓库 `Settings` 页面
2. 在左侧导航栏中选择 `Branches`
3. 在 `Branch protection rules` 部分，点击 `Add branch protection rule` 按钮
4. 在 `Branch name pattern` 输入框中，输入要保护的分支名称或模式（如 `main`、`dev`、`release/*`）
5. 勾选需要启用的保护规则选项
6. 点击 `Create` 按钮

#### 预期界面描述
- 分支保护规则创建后，会显示在 `Branch protection rules` 列表中
- 每个规则条目包含分支模式、创建时间和操作选项

### 2.2 配置必要的审查数量

#### 操作步骤
1. 在创建或编辑分支保护规则时，勾选 `Require a pull request before merging` 选项
2. 勾选 `Require approvals` 选项
3. 在输入框中设置所需的审查者数量（建议设置为1或2）
4. 可选：勾选 `Dismiss stale pull request approvals when new commits are pushed` 选项，当有新提交时自动取消过时的批准
5. 可选：勾选 `Require review from Code Owners` 选项，要求代码所有者审查

#### 预期效果
- 所有合并到受保护分支的代码必须通过Pull Request
- Pull Request必须获得指定数量的批准才能合并
- 当有新提交时，之前的批准会自动失效，需要重新审查

### 2.3 要求状态检查通过

#### 操作步骤
1. 在创建或编辑分支保护规则时，勾选 `Require status checks to pass before merging` 选项
2. 从下拉菜单中选择需要通过的状态检查（如CI构建、代码质量检查等）
3. 可选：勾选 `Require branches to be up to date before merging` 选项，要求分支在合并前必须与目标分支保持同步

#### 预期效果
- 只有当所有指定的状态检查都通过时，Pull Request才能合并
- 如果分支落后于目标分支，必须先更新分支才能合并

### 2.4 禁止强制推送和删除分支

#### 操作步骤
1. 在创建或编辑分支保护规则时，勾选 `Protect matching branches` 选项
2. 勾选 `Do not allow force pushes` 选项，禁止强制推送
3. 勾选 `Do not allow deletions` 选项，禁止删除受保护分支

#### 预期效果
- 无法使用 `git push --force` 命令推送到受保护分支
- 无法删除受保护分支
- 确保受保护分支的历史记录不会被意外修改或删除

### 2.5 限制谁可以推送到受保护分支

#### 操作步骤
1. 在创建或编辑分支保护规则时，勾选 `Restrict who can push to matching branches` 选项
2. 在输入框中添加允许推送的用户或团队
3. 点击 `Save changes` 按钮

#### 预期效果
- 只有指定的用户或团队成员才能直接推送到受保护分支
- 其他成员必须通过Pull Request方式贡献代码
- 增强了受保护分支的安全性

## 3. CI/CD配置

### 3.1 创建GitHub Actions工作流

#### 操作步骤
1. 进入仓库页面，点击 `Actions` 选项卡
2. 在 `Actions` 页面中，点击 `Set up a workflow yourself` 按钮
3. 在编辑器中输入工作流的YAML配置代码
4. 点击 `Start commit` 按钮
5. 输入提交信息，选择提交到的分支
6. 点击 `Commit new file` 按钮

#### YAML配置示例
```yaml
name: CI/CD Workflow

# 触发条件：当main分支有push或PR时触发
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

# 定义作业
jobs:
  build:
    # 运行环境
    runs-on: ubuntu-latest
    
    # 作业步骤
    steps:
    # 步骤1：检出代码
    - uses: actions/checkout@v4
    
    # 步骤2：设置Python环境
    - name: Set up Python 3.10
      uses: actions/setup-python@v5
      with:
        python-version: "3.10"
    
    # 步骤3：安装依赖
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    # 步骤4：运行测试
    - name: Run tests
      run: |
        python -m pytest
    
    # 步骤5：构建项目
    - name: Build project
      run: |
        echo "Building project..."
```

### 3.2 配置触发条件

#### 常用触发条件配置

1. **推送触发**：当指定分支或标签有推送时触发
```yaml
on:
  push:
    branches: [ main, dev ]
    tags: [ v* ]
```

2. **Pull Request触发**：当指定分支有PR时触发
```yaml
on:
  pull_request:
    branches: [ main ]
```

3. **定时触发**：按指定时间间隔触发
```yaml
on:
  schedule:
    - cron: "0 0 * * *"  # 每天UTC时间0点触发
```

4. **手动触发**：允许通过GitHub界面手动触发
```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Environment to deploy to"
        required: true
        default: "staging"
        type: choice
        options:
        - staging
        - production
```

### 3.3 定义作业步骤

#### 作业步骤的基本结构
```yaml
steps:
  - name: Step name  # 步骤名称
    uses: action-name@version  # 使用的动作
    with:  # 动作参数
      param1: value1
      param2: value2
  
  - name: Step name
    run: command  # 执行的命令
    env:  # 环境变量
      VAR_NAME: ${{ secrets.SECRET_NAME }}
```

#### 常用作业步骤

1. **检出代码**：获取仓库代码
```yaml
- uses: actions/checkout@v4
```

2. **设置环境**：配置运行环境
```yaml
- name: Set up Node.js
  uses: actions/setup-node@v4
  with:
    node-version: "18"
```

3. **安装依赖**：安装项目依赖
```yaml
- name: Install dependencies
  run: npm install
```

4. **运行测试**：执行测试用例
```yaml
- name: Run tests
  run: npm test
```

5. **构建项目**：构建生产版本
```yaml
- name: Build project
  run: npm run build
```

6. **部署项目**：部署到服务器或云平台
```yaml
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v4
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./dist
```

### 3.4 设置环境变量

#### 操作步骤
1. 进入仓库 `Settings` 页面
2. 在左侧导航栏中选择 `Secrets and variables` > `Actions`
3. 点击 `New repository secret` 按钮添加机密变量，或点击 `New repository variable` 按钮添加普通变量
4. 输入变量名称和值
5. 点击 `Add secret` 或 `Add variable` 按钮

#### 预期界面描述
- 变量添加后，会显示在 `Secrets` 或 `Variables` 列表中
- 机密变量的值会被隐藏，普通变量的值会显示
- 每个变量条目右侧有 `Update` 和 `Delete` 按钮

#### 注意事项
- 机密变量用于存储敏感信息（如API密钥、密码等），其值不会显示在日志中
- 普通变量用于存储非敏感信息（如配置参数、版本号等）
- 变量名称不区分大小写，但建议使用大写字母和下划线

### 3.5 查看工作流运行状态和结果

#### 操作步骤
1. 进入仓库页面，点击 `Actions` 选项卡
2. 在左侧导航栏中选择要查看的工作流
3. 在工作流运行列表中，点击要查看的运行实例
4. 在运行详情页面中，可以查看：
   - 工作流的触发方式和时间
   - 各个作业的运行状态
   - 每个步骤的详细日志
   - 工作流的输出结果

#### 预期界面描述
- 工作流运行状态会显示为 `success`、`failure`、`cancelled` 或 `in_progress`
- 每个作业会显示运行状态和持续时间
- 点击步骤名称可以展开查看详细日志
- 可以通过 `Rerun all jobs` 或 `Rerun failed jobs` 按钮重新运行工作流

#### 注意事项
- 工作流日志会保留90天，超过时间会自动删除
- 可以通过 `Download workflow run artifacts` 按钮下载工作流生成的产物
- 可以通过 `View raw logs` 按钮查看原始日志

## 3. 最佳实践和注意事项

### 3.1 权限设置最佳实践
- 遵循最小权限原则，只授予必要的权限
- 定期审查协作者和团队的访问权限，移除不再需要访问的成员
- 对敏感仓库使用组织级别的访问控制，而不是个人协作者

### 3.2 分支保护规则最佳实践
- 对所有长期存在的分支（如main、dev）设置分支保护
- 合理设置审查者数量，避免设置过多导致合并延迟
- 根据项目规模和团队结构调整保护规则的严格程度
- 定期审查和更新分支保护规则，适应项目发展需求

### 3.3 CI/CD配置最佳实践
- 保持工作流文件简洁明了，避免过于复杂的逻辑
- 使用模块化设计，将复杂的工作流拆分为多个文件
- 合理设置触发条件，避免不必要的工作流运行
- 为不同环境（如开发、测试、生产）创建不同的工作流
- 定期审查和优化工作流，提高运行效率

### 3.4 安全注意事项
- 不要在工作流文件中硬编码敏感信息，使用机密变量
- 定期轮换机密变量，特别是API密钥和密码
- 限制工作流的权限范围，使用 `permissions` 字段设置最小权限
- 审查第三方动作的安全性，只使用可信来源的动作

## 4. 故障排除

### 4.1 权限设置问题
- **问题**：协作者无法访问仓库
  **解决方法**：检查协作者是否已接受邀请，权限级别是否设置正确，是否在正确的团队中

- **问题**：团队成员无法推送到受保护分支
  **解决方法**：检查分支保护规则是否限制了推送权限，团队成员是否在允许推送的列表中

### 4.2 分支保护规则问题
- **问题**：Pull Request无法合并
  **解决方法**：检查是否满足所有保护规则要求，包括审查数量、状态检查、分支同步等

- **问题**：无法删除受保护分支
  **解决方法**：先删除分支保护规则，再删除分支；或在规则中取消"禁止删除"选项

### 4.3 CI/CD配置问题
- **问题**：工作流运行失败
  **解决方法**：查看详细日志，检查命令是否正确，依赖是否安装成功，环境变量是否设置正确

- **问题**：机密变量无法访问
  **解决方法**：检查变量名称是否正确，是否在正确的仓库中设置，是否使用了正确的语法 `${{ secrets.SECRET_NAME }}`

- **问题**：工作流无法触发
  **解决方法**：检查触发条件是否设置正确，是否有符合条件的事件发生，工作流文件是否有语法错误

## 5. 总结

通过本文档的指导，您可以完成GitHub仓库的权限设置、分支保护规则配置和CI/CD工作流的创建。这些配置将有助于：

- 提高仓库的安全性，防止未经授权的访问和修改
- 确保代码质量，通过强制审查和状态检查
- 自动化构建、测试和部署流程，提高开发效率
- 建立规范的开发流程，便于团队协作和项目管理

建议定期审查和更新这些配置，以适应项目的发展和团队的变化。同时，遵循最佳实践和安全注意事项，确保仓库的安全性和可靠性。