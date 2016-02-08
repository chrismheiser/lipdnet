import httplib2
import os

from apiclient import discovery
import oauth2client
from oauth2client import client
from oauth2client import tools
import re

# GLOBALS
APPLICATION_NAME = 'lipd'
SCOPES = 'https://www.googleapis.com/auth/drive'
CLIENT_SECRET_FILE = 'client_secret_lipd.json'


def get_google_csv(file_id):
    """
    Get a specific spreadsheet file from Google Drive using its FILE_ID.
    Write the spreadsheet on the local system as a CSV.
    :param file_id: (str) Google File ID of target file
    :return: (csv) CSV File
    """

    # Download link format
    link_csv = 'https://docs.google.com/spreadsheet/ccc?key=' + file_id + '&output=csv&pref=2'

    # Get authorization and credentials
    credentials = get_credentials()
    http = credentials.authorize(httplib2.Http())

    # A service object represents one google drive account
    service = discovery.build('drive', 'v3', http=http)

    print("downloading {0}".format(file_id))
    resp, content = service._http.request(link_csv)
    if resp.status == 200:
        filename = file_id + '.csv'
        # Regex the filename from the response object string
        for i in resp['content-disposition'].split(';'):
            if 'filename=' in i:
                try:
                    filename = re.findall(r'"([^"]*)"', i)[0]
                except IndexError:
                    print("No filename to use. Using File ID.")
        with open(filename, 'wb+') as f:
            f.write(content)
    else:
        print('Error downloading: {0}'.format(file_id))
    return


def get_credentials():
    """
    Gets valid user credentials from storage.
    If nothing has been stored, or if the stored credentials are invalid,
    the OAuth2 flow is completed to obtain the new credentials.

    :return: Credentials, the obtained credential.
    """
    home_dir = os.path.expanduser('~')
    credential_dir = os.path.join(home_dir, '.credentials')
    if not os.path.exists(credential_dir):
        os.makedirs(credential_dir)
    credential_path = os.path.join(credential_dir,
                                   CLIENT_SECRET_FILE)

    store = oauth2client.file.Storage(credential_path)
    credentials = store.get()
    if not credentials or credentials.invalid:
        flow = client.flow_from_clientsecrets(CLIENT_SECRET_FILE, SCOPES)
        flow.user_agent = APPLICATION_NAME
        if flags:
            credentials = tools.run_flow(flow, store, flags)
        else: # Needed only for compatibility with Python 2.6
            credentials = tools.run(flow, store)
        print('Storing credentials to ' + credential_path)
    return credentials
