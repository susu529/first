import uvicorn
import os


def main() -> None:
	port = int(os.getenv("PORT", "8000"))
	# 生产环境禁用 reload，开发环境可通过 RELOAD=true 启用
	reload = os.getenv("RELOAD", "false").lower() == "true"
	uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=reload)


if __name__ == "__main__":
	main()


