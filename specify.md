## install
```Python
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```
## upgrade
```Python
uv tool install specify-cli --force --from git+https://github.com/github/spec-kit.git
```

## init
```Python
specify init
```

```Python
/constitutuin       描述项目是什么，怎么开发、测试标准、用户体验
```

```Python
/specify            描述想构建什么以及为什么，不用提及技术栈
```

```Python
/plan               指定技术栈和框架
```

```Python
/tasks               （TDD）
```

```Python
/implement
```

```Python
/clarify     AI询问消除歧义 run before /plan
```

```Python
/analyze     分析任务和需求一致 run after /tasks before /implement
```

