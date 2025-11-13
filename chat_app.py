#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的基于txt文本的LLM聊天应用
支持流式输出和向量搜索
"""

import os
import sys
import json
import numpy as np
from typing import List, Dict, Any
from openai import OpenAI
import argparse

class TextChatApp:
    def __init__(self, api_key: str, base_url: str, llm_model: str, embedding_model: str):
        """初始化聊天应用"""
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.llm_model = llm_model
        self.embedding_model = embedding_model
        
        # 使用OpenAI嵌入API
        print("使用OpenAI嵌入API...")
        
        # 存储文本块和嵌入向量
        self.text_chunks = []
        self.embeddings = []
        
    def load_text_file(self, file_path: str, chunk_size: int = 500):
        """加载并分块处理txt文件"""
        print(f"正在加载文件: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        
        # 简单的文本分块
        chunks = []
        words = text.split()
        current_chunk = []
        
        for word in words:
            current_chunk.append(word)
            if len(' '.join(current_chunk)) > chunk_size:
                chunks.append(' '.join(current_chunk))
                current_chunk = []
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        self.text_chunks = chunks
        print(f"文本已分为 {len(chunks)} 个块")
        
        # 生成嵌入向量
        print("正在生成嵌入向量...")
        self.embeddings = self._get_embeddings(chunks)
        print("嵌入向量生成完成")
    
    def _get_embeddings(self, texts: List[str]) -> np.ndarray:
        """使用OpenAI API获取嵌入向量"""
        embeddings = []
        for text in texts:
            try:
                response = self.client.embeddings.create(
                    model=self.embedding_model,
                    input=text
                )
                embeddings.append(response.data[0].embedding)
            except Exception as e:
                print(f"获取嵌入向量失败: {e}")
                # 使用零向量作为fallback
                embeddings.append([0.0] * 1536)  # text-embedding-3-small的维度
        return np.array(embeddings)
    
    def find_relevant_chunks(self, query: str, top_k: int = 3) -> List[str]:
        """根据查询找到最相关的文本块"""
        query_embedding = self._get_embeddings([query])
        
        # 计算余弦相似度
        similarities = np.dot(self.embeddings, query_embedding.T).flatten()
        
        # 获取最相关的块
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        return [self.text_chunks[i] for i in top_indices]
    
    def stream_chat(self, user_input: str):
        """流式聊天功能"""
        # 找到相关文本块
        relevant_chunks = self.find_relevant_chunks(user_input)
        context = "\n\n".join(relevant_chunks)
        
        # 构建系统提示
        system_prompt = f"""你是一个基于提供文本内容的智能助手。请根据以下文本内容回答用户的问题：

{context}

请基于上述文本内容回答用户的问题。如果文本中没有相关信息，请说明无法从提供的文本中找到答案。"""
        
        # 构建消息
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input}
        ]
        
        # 流式调用LLM
        print("\n助手: ", end="", flush=True)
        try:
            stream = self.client.chat.completions.create(
                model=self.llm_model,
                messages=messages,
                stream=True,
                temperature=0.7
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    print(chunk.choices[0].delta.content, end="", flush=True)
            
            print("\n")
            
        except Exception as e:
            print(f"\n错误: {e}")
    
    def run(self):
        """运行聊天应用"""
        print("=" * 50)
        print("基于文本的LLM聊天应用")
        print("输入 'quit' 或 'exit' 退出")
        print("=" * 50)
        
        while True:
            try:
                user_input = input("\n用户: ").strip()
                
                if user_input.lower() in ['quit', 'exit', '退出']:
                    print("再见！")
                    break
                
                if not user_input:
                    continue
                
                self.stream_chat(user_input)
                
            except KeyboardInterrupt:
                print("\n\n再见！")
                break
            except Exception as e:
                print(f"\n错误: {e}")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="基于txt文本的LLM聊天应用")
    parser.add_argument("txt_file", help="要加载的txt文件路径")
    parser.add_argument("--chunk-size", type=int, default=500, help="文本块大小 (默认: 500)")
    
    args = parser.parse_args()
    
    # 检查文件是否存在
    if not os.path.exists(args.txt_file):
        print(f"错误: 文件 '{args.txt_file}' 不存在")
        sys.exit(1)
    
    # API配置
    API_KEY = "sk-LmHOm5x3pdGEvGYuA9wn983fsAZI0wzSdg63EoAMJcqVsxEB"
    BASE_URL = "https://api.ssopen.top/v1"
    LLM_MODEL = "gpt-4o-mini"
    EMBEDDING_MODEL = "text-embedding-3-small"
    
    try:
        # 创建应用实例
        app = TextChatApp(API_KEY, BASE_URL, LLM_MODEL, EMBEDDING_MODEL)
        
        # 加载文本文件
        app.load_text_file(args.txt_file, args.chunk_size)
        
        # 运行聊天
        app.run()
        
    except Exception as e:
        print(f"应用启动失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
