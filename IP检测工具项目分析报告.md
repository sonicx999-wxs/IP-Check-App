# IP质量法证级检测工具项目分析报告

## 1. 项目概述

本项目是一个名为"IP质量法证级检测工具 V3.0"的Web应用，使用Streamlit构建，主要用于对IP地址进行多维度的安全风险评估。

## 2. 依赖项

根据requirements.txt文件，项目依赖：
- streamlit>=1.35.0
- requests>=2.32.0
- 内置库：json, ipaddress

## 3. API连接方式

### 3.1 密钥管理

项目使用Streamlit的Secrets Management功能管理API密钥，配置在`.streamlit/secrets.toml`文件中：

```toml
[secrets]
IPQS_API_KEY = "您的IPQualityScore密钥"
IPINFO_API_KEY = "您的IPinfo密钥"
SCAMALYTICS_USER = "您的Scamalytics用户名"
SCAMALYTICS_API_KEY = "您的Scamalytics密钥"
```

### 3.2 API调用函数

#### 3.2.1 IPQualityScore API

```python
def fetch_ipqs_data(ip_address):
    # 从Streamlit secrets中获取API密钥
    api_key = st.secrets["secrets"]["IPQS_API_KEY"]
    url_ipqs = f"https://ipqualityscore.com/api/json/ip/{api_key}/{ip_address}?strictness=1"
    response_ipqs = requests.get(url_ipqs).json()
    
    if response_ipqs.get("success"):
        return True, response_ipqs
    else:
        return False, f"IPQualityScore评估失败: {response_ipqs.get('message', '未知错误')}"
```

#### 3.2.2 IPinfo API

```python
def fetch_ipinfo_data(ip_address):
    # 从Streamlit secrets中获取API密钥
    api_key = st.secrets["secrets"]["IPINFO_API_KEY"]
    url_ipinfo = f"https://ipinfo.io/{ip_address}?token={api_key}"
    response_ipinfo = requests.get(url_ipinfo).json()
    
    return True, response_ipinfo
```

#### 3.2.3 Scamalytics API

```python
def fetch_scamalytics_data(ip_address):
    user = st.secrets["secrets"]["SCAMALYTICS_USER"]
    api_key = st.secrets["secrets"]["SCAMALYTICS_API_KEY"]
    
    base_url = f"https://api11.scamalytics.com/v3/{user}/"
    params = {
        'key': api_key,
        'ip': ip_address.strip()
    }
    
    response_scam = requests.get(base_url, params=params, timeout=10)
    response_scam.raise_for_status()
    
    response_data = response_scam.json()
    scam_data_core = response_data.get('scamalytics', {})
    
    if scam_data_core.get("status") == "ok":
        return True, response_data
    else:
        error_message = scam_data_core.get('error', '未知错误')
        return False, f"Scamalytics评估失败: {error_message}"
```

## 4. 返回数据格式

### 4.1 IPQualityScore 返回数据

主要字段包括：
- `success`: API请求是否成功
- `fraud_score`: 欺诈风险评分（0-100）
- `connection_type`: IP连接类型（Residential, Mobile, ISP, Data Center等）
- `vpn`, `proxy`, `tor`: 是否为VPN/代理/Tor节点
- `recent_abuse`: 是否有近期滥用记录
- `bot_status`: 是否检测到机器人活动
- `mobile`: 是否为移动网络IP

### 4.2 IPinfo 返回数据

主要字段包括：
- `org`: ASN和ISP信息
- `company`: 公司信息
- `country_name`: 国家名称
- `city`: 城市名称
- `privacy`: 隐私相关信息，包括是否为代理/VPN/托管服务

### 4.3 Scamalytics 返回数据

主要字段包括：
- `scamalytics.status`: 请求状态
- `scamalytics.scamalytics_score`: 欺诈风险评分
- `scamalytics.scamalytics_risk`: 风险等级
- `scamalytics.scamalytics_proxy.is_datacenter`: 是否为数据中心IP

## 5. 数据处理与分析方式

### 5.1 协调检测流程

```python
def check_ip_quality_v2(ip_address):
    # 1. 获取IPQualityScore数据
    ipqs_success, ipqs_result = fetch_ipqs_data(ip_address)
    ipqs_data = ipqs_result if ipqs_success else None
    
    # 2. 获取IPinfo数据
    ipinfo_success, ipinfo_result = fetch_ipinfo_data(ip_address)
    ipinfo_data = ipinfo_result if ipinfo_success else None
    
    # 3. 获取Scamalytics数据
    scam_success, scam_result = fetch_scamalytics_data(ip_address)
    scamalytics_data = scam_result if scam_success else None
    
    # 4. 分析数据并生成裁决
    final_report = analyze_ip_data(ipqs_data, ipinfo_data, scamalytics_data)
    
    # 5. 整合最终结果
    final_report['ip_address'] = ip_address
    final_report['errors'] = errors
    
    return final_report
```

### 5.2 多源数据交叉验证与分析

项目采用"多源交叉验证"的风险评估方法：

1. **IP档案构建**：整合各API数据，提取地理位置、ASN/ISP、连接类型等信息

2. **风险识别逻辑**：
   - 交叉验证IP是否为数据中心或托管服务
   - 检查欺诈分数是否过高（≥75）
   - 检测是否为VPN/代理/Tor节点
   - 检查近期滥用记录
   - 综合评估多个风险指标

3. **谨慎原则**：当核心情报源（如IPQS）无响应时，降低评估可信度

4. **最终裁决**：根据风险等级生成三种裁决：
   - ❌ [高危]: 绝对不可使用此IP
   - ⚠️ [注意]: 存在潜在风险，谨慎评估
   - ✅ [通过]: 初步符合所有核心安全标准

### 5.3 数据处理流程

1. **输入验证**：使用`ipaddress`库验证IP地址格式
2. **并行API调用**：获取多个数据源的信息
3. **数据整合**：构建统一的IP档案
4. **风险评估**：多维度分析风险因素
5. **裁决生成**：根据分析结果给出最终建议
6. **结果展示**：分层次显示不同详细程度的结果

## 6. 项目实现需求

### 6.1 核心功能需求

1. **IP地址验证**：支持IPv4和IPv6地址的格式验证
2. **多源数据采集**：调用三个不同的API获取全面信息
3. **风险评估引擎**：基于多维度指标进行风险分析
4. **结果展示**：提供分层的结果展示（摘要、详情、原始数据）
5. **历史记录**：保存并显示查询历史
6. **错误处理**：对API调用失败等异常情况进行优雅处理

### 6.2 界面需求

1. **输入区域**：IP地址输入框和检测按钮
2. **三层情报显示**：
   - 摘要层：IP档案速览
   - 详情层：各来源数据详情
   - 调试层：原始数据
3. **最终裁决区**：显示评估结果和建议
4. **AI分析简报**：格式化的Markdown简报
5. **历史记录区**：显示过去的查询结果

### 6.3 安全需求

1. **API密钥保护**：使用Streamlit Secrets管理敏感信息
2. **错误隔离**：单个API失败不影响整体功能
3. **输入验证**：防止无效输入导致的程序错误

## 7. 代码结构总结

项目代码结构清晰，主要包含以下模块：

1. **API调用模块**：三个独立的函数分别调用不同的API
2. **数据分析模块**：整合和分析多源数据
3. **协调控制模块**：协调检测流程和错误处理
4. **UI展示模块**：Streamlit界面实现
5. **会话管理模块**：使用session_state保存历史记录

## 8. 项目特点

1. **多源交叉验证**：通过三个不同的数据源提高评估准确性
2. **分层展示**：从概览到详情的多层次信息展示
3. **完整的错误处理**：对各种异常情况进行了处理
4. **用户友好**：提供清晰的结果和建议
5. **安全性考虑**：使用专业的密钥管理方式

此分析报告提供了项目的关键技术细节，可作为新项目开发的参考基础。