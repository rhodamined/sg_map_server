# --- imports ---- #
import datetime
import sys
import pandas as pd
import json
import os
from pathlib import Path

import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

# Notes: 
# - several reference file paths are hard-coded in
# - the json file read produces a 'datetime' FutureWarning due to internal bug to pandas
# -- it is a minor warning and suppressed using the above 'filterwarnings' code
# -- it is due to the json using a mix of ints and strings as keys

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(f"Argument 1: {sys.argv[1]}")
        
        # ------------------------------------------------ #
        # READ FILES
        # ------------------------------------------------ #
        # Open the JSON file in read mode ('r')
        # Process it to add time info from file string
        # Return as pandas dataframe
        # Note: file paths and file strings are different; need different methods to split string

        def read_json_to_pd(file_path):
            try:
                with open(file_path, 'r') as file:
                    # -- Load the JSON data from the file into a Python object
                    json_data = json.load(file)

                    # -- this json has a metadata value; ignore it, parse json out of just the value
                    df =  pd.json_normalize(json_data['value'])

                    # -- add columns for timestamps
                    # time_str format expected: 2025-08-11_00-00

                    # -- syntax for file string: 
                    # time_str = file_str.split('/')[-1].split('.')[0] 

                    # -- syntax for file path:
                    # time_str = os.path.splitext(file_path)[0].split('\\')[-1]  # - windows
                    time_str = os.path.splitext(file_path)[0].split('/')[-1]  # - mac

                    df['year'] = int(time_str.split('-')[0])
                    df['month'] = int(time_str.split('-')[1])
                    df['day'] = int(time_str.split('-')[2].split('_')[0])
                    df['hour'] = int(time_str.split('_')[-1].split('-')[0])
                    df['minute'] = int(time_str.split('_')[-1].split('-')[-1])
                    
                    return df
                        
            except FileNotFoundError:
                print("Error: '" + file_path + "' not found.")
            except json.JSONDecodeError:
                print("Error: Invalid JSON format in '" + file_path + "data.json'.")


        # Read in all files from directory and concat into single dataframe
        # Even for a single day it's kind of big, might take a second
        root_dir = './data/carpark_availability/'
        
        # date_str = '2025-08-11' #example
        date_str = sys.argv[1]
        directory = Path(root_dir + date_str)  # set directory path

        li = []

        for file in directory.iterdir():  
            if file.is_file():  # Check if it's a file
                df = read_json_to_pd(file)
                li.append(df)
                
        carpark_all = pd.concat(li, axis=0, ignore_index=True)
        # print(carpark_all[:4])
        
        
        # ------------------------------------------------ #
        # CLEAN CARPARK DF
        # ------------------------------------------------ #

        # Standardize column names
        carpark_all = carpark_all.rename(columns={'CarParkID': 'id', 
                                'Development': 'development',
                                'AvailableLots': 'available_lots'})

        # Drop unnecessary columns
        carpark_all = carpark_all.drop(columns=['Area', 'Location', 'LotType', 'Agency'])
        carpark_all = carpark_all.dropna()

        # Aggregation & calculation of summary info
        carpark_minmax = carpark_all.groupby('id').agg(
            avail_min = ('available_lots', 'min'), 
            avail_max = ('available_lots', 'max'), 
            avail_avg = ('available_lots', 'mean'),  
        )

        # Merge min max avail back into main df
        carpark_all = carpark_all.merge(carpark_minmax, on="id")

        # Calculate normalized availability
        carpark_all['avail_norm'] = (carpark_all['available_lots'] - carpark_all['avail_min']) / (carpark_all['avail_max'] - carpark_all['avail_min'])
                     
        # Some lots have 0 change so normalizing will divide by 0... fill NAs with 0
        carpark_all['avail_norm'] = carpark_all['avail_norm'].fillna(0)
        
        
        # ------------------------------------------------ #
        # IMPORT REFERENCE JSON OF CARPARK-KML & MERGE
        # ------------------------------------------------ #
        # triggers a ton of warnings but works
        ref_kml = pd.read_json('./output/SG_carpark_IDs.json', orient='index')
        ref_kml = ref_kml.reset_index()
        ref_kml = ref_kml.rename(columns={"index": "id"})
        
        carpark_kml = ref_kml[['id', 'subzone_kml', 'region_name', 'region_num']]

        carpark_all = carpark_all.merge(carpark_kml, on="id")


        # ------------------------------------------------ #
        # MERGE AND SUMMARIZE AVAILABLE LOTS PER KML
        # ------------------------------------------------ #
        grouped = carpark_all.groupby(['subzone_kml', 'hour'])

        summary = grouped.agg(avail_norm = ('avail_norm', 'mean'))
        summary_df = pd.DataFrame(summary)

        summary_df = summary_df.reset_index()
        
        # ------------------------------------------------ #
        # REMAP <AVAIL PER KML> TO <LED VALUES 0-255>
        # ------------------------------------------------ #
        summary_df['led_val'] = summary_df['avail_norm'] * 255
        summary_df['led_val'] = summary_df['led_val'].astype('int64')
        
        
        # ------------------------------------------------ #
        # IMPORT CSV REFERENCE OF LEDS-KMLS & MERGE
        # ------------------------------------------------ #
        led_ref = pd.read_csv('./output/subzone_kml_ref_by_region.csv')
        
        # merge right to preserve ALL LED #s
        # All leds / kmls without hourly lot data will have only 1 row of NAs
        summary_df = summary_df.merge(led_ref, how="right", on="subzone_kml")
        
        # ------------------------------------------------ #
        # CLEAN & REORDER DATAFRAME
        # ------------------------------------------------ #
        # fill NAs with 0s and recast floats to ints
        summary_df['led_val'] = summary_df['led_val'].fillna(0)
        summary_df['hour'] = summary_df['hour'].fillna(0)
        summary_df['avail_norm'] = summary_df['avail_norm'].fillna(0)
        summary_df['led_val'] = summary_df['led_val'].astype('int64')
        summary_df['hour'] = summary_df['hour'].astype('int64')

        # sort by region, led# and hour
        summary_df = summary_df.sort_values(by=['region_no', 'led_no', 'hour'])

        # reorder
        summary_df = summary_df[['region_no', 'region_n', 'led_no', 'hour', 'avail_norm', 'led_val', 'subzone_no', 'subzone_n', 'subzone_kml']]
        summary_df = summary_df.reset_index(drop=True)

        # ------------------------------------------------ #
        # WRITE DATAFRAME TO CSV
        # ------------------------------------------------ #
        summary_df.to_csv('./output/led_csv_test.csv', index = False)

        print(summary_df[:4])
        
        # ------------------------------------------------ #
        # FORMAT TO DICT FOR JSON 
        # ------------------------------------------------ #
        # make copy of summary_df
        df = summary_df
        
        # collapse hour and led_val cols into lists; if only 1 val (no data), make array of 24 zeros to match data structure
        f = lambda x: x.tolist() if len(x) > 1 else [0]*24
        
        df = df.groupby(['region_n', 'region_no', 'led_no','subzone_no', 'subzone_n', 'subzone_kml']).agg(
            hour = ('hour', f),  
            led_val = ('led_val', f),   
            avail_norm = ('avail_norm', f),   
        ).reset_index().reindex(df.columns, axis=1)

        # choose cols Matthew needs
        df = df[['region_n', 'led_no', 'led_val', 'subzone_n', 'subzone_kml']] 

        # rename to Matthew's json format
        df = df.rename(columns={'led_no': 'led_number', 'led_val': 'carpark', 'subzone_n': 'name', 'subzone_kml': 'kml'})
        
        # Group by region and turn rows into a list of dictionaries for each group
        df = df.groupby(['region_n'])[['led_number', 'carpark', 'name', 'kml']].apply(lambda x: x.to_dict(orient='records'))
        df = df.reset_index()

        # rename cols of new df shape
        df = df.rename(columns={"region_n": "name", 0: "subzones"})

        # put it all in a dict
        jj = { "regions": df.to_dict(orient='records')}

        # ------------------------------------------------ #
        # WRITE JSON TO FILE 
        # ------------------------------------------------ #
        # Specify the filename for the JSON output
        root_dir = './output/carpark/'
        filename = root_dir + date_str + "_carpark.json"
        
        # Open the file in write mode ("w")
        # The 'with' statement ensures the file is properly closed even if errors occur
        with open(filename, "w") as json_file:
            json.dump(jj, json_file, indent=4) 
        
        # ------------------------------------------------ #
        # WRITE LOGS
        # ------------------------------------------------ #
        with open("log.txt", "a") as f:
            f.write(f"Date provided: {sys.argv[1]}\n")
            f.write(f"Python script executed at: {datetime.datetime.now()}\n")
    else:
        print("No arguments provided. Please supply a date in format YYYY-MM-DD.")

    