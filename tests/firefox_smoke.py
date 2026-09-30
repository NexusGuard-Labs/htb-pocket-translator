"""Instala o pacote real temporariamente no Firefox desktop, sem chaves ou conta HTB."""
import json
import os
from pathlib import Path
import subprocess
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait

root = Path(__file__).resolve().parents[1]
package = subprocess.check_output(['python3', str(root / 'package_addon.py')], text=True).strip()
options = Options()
options.add_argument('-headless')
options.binary_location = os.environ.get('FIREFOX_PATH', '/usr/bin/firefox')
service = Service(executable_path=os.environ.get('GECKODRIVER', 'geckodriver'), service_args=['--allow-system-access'])
driver = webdriver.Firefox(options=options, service=service)
try:
    addon_id = driver.install_addon(package, temporary=True)
    assert addon_id == 'htb-pocket-translator@nexusguard-labs'
    driver.set_context('chrome')
    ids = json.loads(driver.execute_script('return Services.prefs.getStringPref("extensions.webextensions.uuids");'))
    driver.set_context('content')
    driver.get(f'moz-extension://{ids[addon_id]}/popup.html')
    wait = WebDriverWait(driver, 10)
    try:
        wait.until(lambda d: d.find_element(By.ID, 'header-status-badge').get_attribute('textContent') == 'Sem chave')
    except Exception:
        print('Diagnóstico do popup:', driver.find_element(By.TAG_NAME, 'body').text)
        raise
    assert driver.find_element(By.ID, 'api-key-input').get_attribute('type') == 'password'
    driver.find_element(By.ID, 'api-key-input').send_keys('firefox-test-credential-only')
    driver.find_element(By.ID, 'btn-save-key').click()
    wait.until(lambda d: 'Chave salva' in d.find_element(By.ID, 'api-feedback').text)
    assert driver.find_element(By.ID, 'api-key-input').get_attribute('value') == ''
    driver.find_element(By.ID, 'glossary-input').send_keys('Ticket Granting Ticket')
    driver.find_element(By.ID, 'btn-save-glossary').click()
    wait.until(lambda d: 'Glossário salvo' in d.find_element(By.ID, 'api-feedback').text)
    driver.refresh()
    wait.until(lambda d: d.find_element(By.ID, 'glossary-input').get_attribute('value') == 'Ticket Granting Ticket')
    print('Firefox real: instalação, background, chave mascarada e glossário aprovados.')
finally:
    driver.quit()
