import atexit

import requests

http_session = requests.Session()
atexit.register(http_session.close)
